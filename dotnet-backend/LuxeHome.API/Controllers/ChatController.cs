using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using LuxeHome.Application.UseCases;
using LuxeHome.Domain.Entities;

namespace LuxeHome.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatController : ControllerBase
    {
        private readonly ChatUseCase _chatUseCase;

        public ChatController(ChatUseCase chatUseCase)
        {
            _chatUseCase = chatUseCase ?? throw new ArgumentNullException(nameof(chatUseCase));
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] ChatRequest request)
        {
            if (request == null || request.Messages == null)
            {
                return BadRequest(new { error = "Tham số 'messages' không hợp lệ." });
            }

            try
            {
                var responseText = await _chatUseCase.ExecuteAsync(request.Messages);
                return Ok(new
                {
                    role = "model",
                    text = responseText
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }

    public class ChatRequest
    {
        public List<Message>? Messages { get; set; }
    }
}
