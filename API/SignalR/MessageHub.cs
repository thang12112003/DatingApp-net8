using API.DTOs;
 using API.Entities;
 using API.Extensions;
 using API.Interfaces;
 using AutoMapper;
 using Microsoft.AspNetCore.SignalR;
 
 namespace API.SignalR;
 
 public class MessageHub(IUnitOfWork unitOfWork, IMapper mapper, IHubContext<PresenceHub> presenceHub) : Hub
 {
     public override async Task OnConnectedAsync()
     {
         var httpContext = Context.GetHttpContext();
         var otherUser = httpContext?.Request.Query["user"];
 
         if (Context.User == null || string.IsNullOrEmpty(otherUser)) 
             throw new Exception("Cannot join group");
         var groupName = GetGroupName(Context.User.GetUsername(), otherUser);
         await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
         var group = await AddToGroup(groupName);
 
         await Clients.Group(groupName).SendAsync("UpdatedGroup", group);
 
         var messages = await unitOfWork.MessageRepository.GetMessageThread(Context.User.GetUsername(), otherUser!);

         if(unitOfWork.HasChanges()) 
         {
             await unitOfWork.Complete();
         }
 
         await Clients.Caller.SendAsync("ReceiveMessageThread", messages);
         
     }
 
     public override async Task OnDisconnectedAsync(Exception? exception)
     {
         var group = await RemoveFromMessageGroup();
         await Clients.Group(group.Name).SendAsync("UpdatedGroup", group);
         await base.OnDisconnectedAsync(exception);
     }
 
     public async Task SendMessage(CreateMessageDto createMessageDto)
     {
          var username = Context.User?.GetUsername() ?? throw new Exception("could not get user");
 
         if (username == createMessageDto.RecipientUsername.ToLower())
             throw new HubException("You cannot message yourself");
         
         var sender = await unitOfWork.UserRepository.GetUserByUsernameAsync(username);
         var recipient = await unitOfWork.UserRepository.GetUserByUsernameAsync(createMessageDto.RecipientUsername);
 
         if (recipient == null || sender == null || sender.UserName == null || recipient.UserName == null) 
             throw new HubException("Cannot send message at this time");
 
         var message = new Message
         {
             Sender = sender,
             Recipient = recipient,
             SenderUsername = sender.UserName,
             RecipientUsername = recipient.UserName,
             Content = createMessageDto.Content
         };
 
         var groupName = GetGroupName(sender.UserName, recipient.UserName);
         var group = await unitOfWork.MessageRepository.GetMessageGroup(groupName);
 
         if (group != null && group.Connections.Any(x => x.Username == recipient.UserName))
         {
             message.DateRead = DateTime.UtcNow;
         } 
         else 
         {
             var connections = await PresenceTracker.GetConnectionsForUser(recipient.UserName);
             if (connections != null && connections?.Count != null)
             {
                 await presenceHub.Clients.Clients(connections).SendAsync("NewMessageReceived", 
                     new {username = sender.UserName, knownAs = sender.KnownAs});
             }
         }
 
         unitOfWork.MessageRepository.AddMessage(message);
 
         if (await unitOfWork.Complete()) 
         {
             await Clients.Group(groupName).SendAsync("NewMessage", mapper.Map<MessageDto>(message));
         }
     }
 
     private async Task<Group> AddToGroup(string groupName)
     {
         var username = Context.User?.GetUsername() ?? throw new Exception("Cannot get username");
         var group = await unitOfWork.MessageRepository.GetMessageGroup(groupName);
         var connection = new Connection{ConnectionId = Context.ConnectionId, Username = username};
 
         if (group == null)
         {
             group = new Group{Name = groupName};
             unitOfWork.MessageRepository.AddGroup(group);
         }
 
         group.Connections.Add(connection);
 
         if (await unitOfWork.Complete()) return group;
 
         throw new HubException("Failed to join group");
     }
 
     private async Task<Group> RemoveFromMessageGroup() 
     {
         var group = await unitOfWork.MessageRepository.GetGroupForConnection(Context.ConnectionId);
         var connection = group?.Connections.FirstOrDefault(x => x.ConnectionId == Context.ConnectionId);
         if (connection != null && group != null)
         {
             unitOfWork.MessageRepository.RemoveConnection(connection);
             if (await unitOfWork.Complete()) return group;
         }
 
         throw new Exception("Failed to remove from group");
     }
 
     private string GetGroupName(string caller, string? other) 
     {
         var stringCompare = string.CompareOrdinal(caller, other) < 0;
         return stringCompare ? $"{caller}-{other}" : $"{other}-{caller}";
     }

     public async Task UpdateMessage(UpdateMessageDto updateMessageDto, int messageId)
{
    var username = Context.User?.GetUsername() ?? throw new HubException("Could not get user");
    var message = await unitOfWork.MessageRepository.GetMessage(messageId);

    if (message == null) throw new HubException("Message not found");
    if (message.SenderUsername != username) throw new HubException("You can only edit your own messages");
    if (message.RecipientDeleted) throw new HubException("Cannot edit a message that has been deleted by the recipient");

    message.Content = updateMessageDto.Content ?? throw new HubException("Message content cannot be null");
    message.DateEdited = DateTime.UtcNow;

    unitOfWork.MessageRepository.UpdateMessage(message);

    if (await unitOfWork.Complete())
    {
        var groupName = GetGroupName(username, message.RecipientUsername);
        await Clients.Group(groupName).SendAsync("UpdatedMessage", mapper.Map<MessageDto>(message));
    }
    else
    {
        throw new HubException("Failed to update message");
    }
}

public async Task DeleteMessage(int messageId)
{
    var username = Context.User?.GetUsername() ?? throw new HubException("Could not get user");
    var message = await unitOfWork.MessageRepository.GetMessage(messageId);

    if (message == null) throw new HubException("Message not found");
    if (message.SenderUsername != username && message.RecipientUsername != username)
        throw new HubException("You cannot delete this message");

    if (message.SenderUsername == username) message.SenderDeleted = true;
    if (message.RecipientUsername == username) message.RecipientDeleted = true;

    if (message is { SenderDeleted: true, RecipientDeleted: true })
    {
        unitOfWork.MessageRepository.DeleteMessage(message);
    }

    if (await unitOfWork.Complete())
    {
        var groupName = GetGroupName(message.SenderUsername, message.RecipientUsername);
        await Clients.Group(groupName).SendAsync("DeletedMessage", messageId);
    }
    else
    {
        throw new HubException("Failed to delete message");
    }
}
 }