using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Interfaces;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{    
    [Authorize]

    public class MessagesController(IUnitOfWork unitOfWork, IMapper mapper) : BaseApiController
    {

    [HttpPost]
     public async Task<ActionResult<MessageDto>> CreateMessage(CreateMessageDto createMessageDto)
     {
         var username = User.GetUsername();
 
         if (username == createMessageDto.RecipientUsername.ToLower())
             return BadRequest("You cannot message yourself");
         
         var sender = await unitOfWork.UserRepository.GetUserByUsernameAsync(username);
         var recipient = await unitOfWork.UserRepository.GetUserByUsernameAsync(createMessageDto.RecipientUsername);
    
        if (recipient == null || sender == null || sender.UserName == null || recipient.UserName == null) 
             return BadRequest("Cannot send message at this time"); 
         var message = new Message
         {
             Sender = sender,
             Recipient = recipient,
             SenderUsername = sender.UserName,
             RecipientUsername = recipient.UserName,
             Content = createMessageDto.Content
         };
 
         unitOfWork.MessageRepository.AddMessage(message);
 
         if (await unitOfWork.Complete()) return Ok(mapper.Map<MessageDto>(message));
 
         return BadRequest("Failed to save message");
     }

    [HttpGet]
     public async Task<ActionResult<IEnumerable<MessageDto>>> GetMessagesForUser(
         [FromQuery]MessageParams messageParams)
     {
         messageParams.Username = User.GetUsername();
 
         var messages = await unitOfWork.MessageRepository.GetMessagesForUser(messageParams);
 
         Response.AddPaginationHeader(messages);
 
         return messages;
     }
 
     [HttpGet("thread/{username}")]
     public async Task<ActionResult<IEnumerable<MessageDto>>> GetMessageThread(string username)
     {
         var currentUsername = User.GetUsername();
 
         return Ok(await unitOfWork.MessageRepository.GetMessageThread(currentUsername, username));
     }

     [HttpPut("{id}")]
    public async Task<ActionResult> UpdateMessage(int id, [FromBody] UpdateMessageDto updateMessageDto)
{
    var username = User.GetUsername();
    var message = await unitOfWork.MessageRepository.GetMessage(id);

    if (message == null) return NotFound("Message not found");
    if (message.SenderUsername != username) return Forbid("You can only edit your own messages");
    if (message.RecipientDeleted) return BadRequest("Cannot edit a message that has been deleted by the recipient");

    if (updateMessageDto.Content == null) 
        return BadRequest("Message content cannot be null");

    message.Content = updateMessageDto.Content;
    message.DateEdited = DateTime.UtcNow; // Lưu thời gian chỉnh sửa

    unitOfWork.MessageRepository.UpdateMessage(message);

    if (await unitOfWork.Complete()) return Ok(mapper.Map<MessageDto>(message));

    return BadRequest("Failed to update message");
}
 
     [HttpDelete("{id}")]
     public async Task<ActionResult> DeleteMessage(int id)
     {
         var username = User.GetUsername();
 
         var message = await unitOfWork.MessageRepository.GetMessage(id);
 
         if (message == null) return BadRequest("Cannot delete this message");
 
         if (message.SenderUsername != username && message.RecipientUsername != username) 
             return Forbid();
 
         if (message.SenderUsername == username) message.SenderDeleted = true;
         if (message.RecipientUsername == username) message.RecipientDeleted = true;
 
         if (message is {SenderDeleted: true, RecipientDeleted: true}) {
             unitOfWork.MessageRepository.DeleteMessage(message);
         }
 
         if (await unitOfWork.Complete()) return Ok();
 
         return BadRequest("Problem deleting the message");
     }
    }
}
