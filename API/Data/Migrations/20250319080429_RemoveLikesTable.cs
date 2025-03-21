using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Data.Migrations
{
    /// <inheritdoc />
    public partial class RemoveLikesTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Likes_Users_SourceUserId1",
                table: "Likes");

            migrationBuilder.DropIndex(
                name: "IX_Likes_SourceUserId1",
                table: "Likes");

            migrationBuilder.DropColumn(
                name: "SourceUserId1",
                table: "Likes");

            migrationBuilder.CreateIndex(
                name: "IX_Likes_TargeUserId",
                table: "Likes",
                column: "TargeUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Likes_Users_TargeUserId",
                table: "Likes",
                column: "TargeUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Likes_Users_TargeUserId",
                table: "Likes");

            migrationBuilder.DropIndex(
                name: "IX_Likes_TargeUserId",
                table: "Likes");

            migrationBuilder.AddColumn<int>(
                name: "SourceUserId1",
                table: "Likes",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Likes_SourceUserId1",
                table: "Likes",
                column: "SourceUserId1");

            migrationBuilder.AddForeignKey(
                name: "FK_Likes_Users_SourceUserId1",
                table: "Likes",
                column: "SourceUserId1",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
