using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Data.Migrations
{
    /// <inheritdoc />
    public partial class RenameTargeUserToTargetUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Likes_Users_TargeUserId",
                table: "Likes");

            migrationBuilder.RenameColumn(
                name: "TargeUserId",
                table: "Likes",
                newName: "TargetUserId");

            migrationBuilder.RenameIndex(
                name: "IX_Likes_TargeUserId",
                table: "Likes",
                newName: "IX_Likes_TargetUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Likes_Users_TargetUserId",
                table: "Likes",
                column: "TargetUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Likes_Users_TargetUserId",
                table: "Likes");

            migrationBuilder.RenameColumn(
                name: "TargetUserId",
                table: "Likes",
                newName: "TargeUserId");

            migrationBuilder.RenameIndex(
                name: "IX_Likes_TargetUserId",
                table: "Likes",
                newName: "IX_Likes_TargeUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Likes_Users_TargeUserId",
                table: "Likes",
                column: "TargeUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
