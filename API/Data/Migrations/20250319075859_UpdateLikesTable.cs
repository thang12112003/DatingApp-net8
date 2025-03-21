using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Data.Migrations
{
    /// <inheritdoc />
    public partial class UpdateLikesTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Likes_Users_LikedUserId",
                table: "Likes");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Likes",
                table: "Likes");

            migrationBuilder.RenameColumn(
                name: "LikedUserId",
                table: "Likes",
                newName: "SourceUserId1");

            migrationBuilder.RenameIndex(
                name: "IX_Likes_LikedUserId",
                table: "Likes",
                newName: "IX_Likes_SourceUserId1");

            migrationBuilder.AddColumn<int>(
                name: "TargeUserId",
                table: "Likes",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddPrimaryKey(
                name: "PK_Likes",
                table: "Likes",
                columns: new[] { "SourceUserId", "TargeUserId" });

            migrationBuilder.AddForeignKey(
                name: "FK_Likes_Users_SourceUserId1",
                table: "Likes",
                column: "SourceUserId1",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Likes_Users_SourceUserId1",
                table: "Likes");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Likes",
                table: "Likes");

            migrationBuilder.DropColumn(
                name: "TargeUserId",
                table: "Likes");

            migrationBuilder.RenameColumn(
                name: "SourceUserId1",
                table: "Likes",
                newName: "LikedUserId");

            migrationBuilder.RenameIndex(
                name: "IX_Likes_SourceUserId1",
                table: "Likes",
                newName: "IX_Likes_LikedUserId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Likes",
                table: "Likes",
                columns: new[] { "SourceUserId", "LikedUserId" });

            migrationBuilder.AddForeignKey(
                name: "FK_Likes_Users_LikedUserId",
                table: "Likes",
                column: "LikedUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
