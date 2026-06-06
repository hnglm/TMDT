using System.Collections.Generic;
using System.Threading.Tasks;
using LuxeHome.Domain.Entities;

namespace LuxeHome.Domain.Interfaces
{
    public interface IAIService
    {
        Task<string> GenerateChatAsync(List<Message> messages, string systemInstruction);
        Task<ImageSearchResult> AnalyzeImageAsync(string imageBase64, string mimeType, string instruction);
        bool IsOffline();
    }
}
