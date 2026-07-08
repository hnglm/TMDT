namespace LuxeHome.Application.Services
{
    using System.Collections.Generic;
    using System.Globalization;
    using System.Security.Cryptography;
    using System.Text;
    using Microsoft.AspNetCore.Http;
    using Microsoft.Extensions.Configuration;

    public class VnPayService
    {
        public string CreatePaymentUrl(decimal amount, string orderId, string ipAddress, IConfiguration config)
        {
            var vnp_TmnCode = (config["Vnpay:TmnCode"] ?? "").Trim();
            var vnp_HashSecret = (config["Vnpay:HashSecret"] ?? "").Trim();
            var vnp_Url = (config["Vnpay:BaseUrl"] ?? "").Trim();
            var vnp_ReturnUrl = (config["Vnpay:ReturnUrl"] ?? "").Trim();

            if (string.IsNullOrEmpty(vnp_TmnCode))
                throw new Exception("Thieu Vnpay:TmnCode");

            if (string.IsNullOrEmpty(vnp_HashSecret))
                throw new Exception("Thieu Vnpay:HashSecret");

            if (string.IsNullOrEmpty(vnp_Url))
                throw new Exception("Thieu Vnpay:BaseUrl");

            if (string.IsNullOrEmpty(vnp_ReturnUrl))
                throw new Exception("Thieu Vnpay:ReturnUrl");

            var now = DateTime.UtcNow.AddHours(7);

            var cleanOrderId = new string(orderId.Where(char.IsLetterOrDigit).ToArray());

            if (string.IsNullOrWhiteSpace(cleanOrderId))
            {
                cleanOrderId = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString();
            }

            var txnRef = cleanOrderId;
            
            var vnpAmount = ((long)Math.Round(amount * 100m, MidpointRounding.AwayFromZero))
                .ToString(CultureInfo.InvariantCulture);

            if (string.IsNullOrWhiteSpace(ipAddress) || ipAddress == "::1")
            {
                ipAddress = "127.0.0.1";
            }

            var pay = new SortedList<string, string>(new VnPayCompare());

            pay.Add("vnp_Amount", vnpAmount);
            pay.Add("vnp_Command", "pay");
            pay.Add("vnp_CreateDate", now.ToString("yyyyMMddHHmmss"));
            pay.Add("vnp_CurrCode", "VND");
            pay.Add("vnp_ExpireDate", now.AddMinutes(15).ToString("yyyyMMddHHmmss"));
            pay.Add("vnp_IpAddr", ipAddress);
            pay.Add("vnp_Locale", "vn");
            pay.Add("vnp_OrderInfo", $"Thanh toan don hang {txnRef}");
            pay.Add("vnp_OrderType", "other");
            pay.Add("vnp_ReturnUrl", vnp_ReturnUrl);
            pay.Add("vnp_TmnCode", vnp_TmnCode);
            pay.Add("vnp_TxnRef", txnRef);
            pay.Add("vnp_Version", "2.1.0");

            string queryString = BuildQueryString(pay);
            string secureHash = HmacSHA512(vnp_HashSecret, queryString);

            Console.WriteLine("========== VNPAY CREATE PAYMENT DEBUG ==========");
            Console.WriteLine("TmnCode: " + vnp_TmnCode);
            Console.WriteLine("HashSecret Length: " + vnp_HashSecret.Length);

            if (vnp_HashSecret.Length >= 8)
            {
                Console.WriteLine("HashSecret Preview: " +
                    vnp_HashSecret.Substring(0, 4) +
                    "..." +
                    vnp_HashSecret.Substring(vnp_HashSecret.Length - 4));
            }

            Console.WriteLine("BaseUrl: " + vnp_Url);
            Console.WriteLine("ReturnUrl: " + vnp_ReturnUrl);
            Console.WriteLine("Amount Input: " + amount);
            Console.WriteLine("vnp_Amount: " + vnpAmount);
            Console.WriteLine("OrderId Input: " + orderId);
            Console.WriteLine("TxnRef: " + txnRef);
            Console.WriteLine("IpAddress: " + ipAddress);
            Console.WriteLine("CreateDate: " + now.ToString("yyyyMMddHHmmss"));
            Console.WriteLine("ExpireDate: " + now.AddMinutes(15).ToString("yyyyMMddHHmmss"));
            Console.WriteLine("QueryString/SignData:");
            Console.WriteLine(queryString);
            Console.WriteLine("SecureHash:");
            Console.WriteLine(secureHash);
            Console.WriteLine("PaymentUrl:");
            Console.WriteLine($"{vnp_Url}?{queryString}&vnp_SecureHash={secureHash}");
            Console.WriteLine("================================================");

            return $"{vnp_Url}?{queryString}&vnp_SecureHash={secureHash}";
        }

        public bool ValidateSignature(IQueryCollection query, string secretKey)
        {
            var vnp_SecureHash = query["vnp_SecureHash"].ToString();

            if (string.IsNullOrWhiteSpace(vnp_SecureHash))
                return false;

            var sortedQuery = new SortedList<string, string>(new VnPayCompare());

            foreach (var item in query)
            {
                var key = item.Key;
                var value = item.Value.ToString();

                if (string.IsNullOrEmpty(key)) continue;

                if (key.Equals("vnp_SecureHash", StringComparison.OrdinalIgnoreCase)) continue;
                if (key.Equals("vnp_SecureHashType", StringComparison.OrdinalIgnoreCase)) continue;

                if (key.StartsWith("vnp_", StringComparison.OrdinalIgnoreCase))
                {
                    sortedQuery[key] = value;
                }
            }

            string rawData = BuildQueryString(sortedQuery);
            string myHash = HmacSHA512(secretKey.Trim(), rawData);

            Console.WriteLine("========== VNPAY RETURN DEBUG ==========");
            Console.WriteLine("RawData:");
            Console.WriteLine(rawData);
            Console.WriteLine("MyHash:");
            Console.WriteLine(myHash);
            Console.WriteLine("VNPay SecureHash:");
            Console.WriteLine(vnp_SecureHash);
            Console.WriteLine("IsValid: " + myHash.Equals(vnp_SecureHash, StringComparison.OrdinalIgnoreCase));
            Console.WriteLine("========================================");

            return myHash.Equals(vnp_SecureHash, StringComparison.OrdinalIgnoreCase);
        }

        private static string BuildQueryString(SortedList<string, string> data)
        {
            var sb = new StringBuilder();

            foreach (var kv in data)
            {
                if (string.IsNullOrEmpty(kv.Value)) continue;

                if (sb.Length > 0)
                    sb.Append('&');

                sb.Append(VnPayUrlEncode(kv.Key));
                sb.Append('=');
                sb.Append(VnPayUrlEncode(kv.Value));
            }

            return sb.ToString();
        }

        private static string VnPayUrlEncode(string value)
        {
            if (string.IsNullOrEmpty(value))
                return string.Empty;

            var bytes = Encoding.UTF8.GetBytes(value);
            var sb = new StringBuilder();

            foreach (var b in bytes)
            {
                char c = (char)b;

                if (
                    (c >= 'a' && c <= 'z') ||
                    (c >= 'A' && c <= 'Z') ||
                    (c >= '0' && c <= '9') ||
                    c == '-' || c == '_' || c == '.' || c == '~'
                )
                {
                    sb.Append(c);
                }
                else if (c == ' ')
                {
                    sb.Append('+');
                }
                else
                {
                    sb.Append('%');
                    sb.Append(b.ToString("X2"));
                }
            }

            return sb.ToString();
        }

        private static string HmacSHA512(string key, string inputData)
        {
            var keyBytes = Encoding.UTF8.GetBytes(key.Trim());
            var inputBytes = Encoding.UTF8.GetBytes(inputData);

            using var hmac = new HMACSHA512(keyBytes);
            var hashValue = hmac.ComputeHash(inputBytes);

            return BitConverter.ToString(hashValue)
                .Replace("-", "")
                .ToLowerInvariant();
        }

        private static DateTime GetVietnamTime()
        {
            try
            {
                var timeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
                return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, timeZone);
            }
            catch
            {
                return DateTime.UtcNow.AddHours(7);
            }
        }
    }

    public class VnPayCompare : IComparer<string>
    {
        public int Compare(string? x, string? y)
        {
            if (x == y) return 0;
            if (x == null) return -1;
            if (y == null) return 1;

            return StringComparer.Ordinal.Compare(x, y);
        }
    }
}