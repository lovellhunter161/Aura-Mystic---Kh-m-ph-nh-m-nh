import { GoogleGenAI } from "@google/genai";

export type MysticType = 'numerology' | 'horoscope' | 'birthchart' | 'tarot';

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    // Vite replaces process.env.GEMINI_API_KEY with the actual value during build
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured. Please set it in your environment variables.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function getMysticInterpretation(type: MysticType, data: any) {
  let prompt = "";
  // ... (rest of the prompt logic remains same)

  if (type === 'numerology') {
    prompt = `
      Bạn là một chuyên gia Thần số học chuyên sâu. Phân tích các chỉ số:
      - Họ tên: ${data.name}
      - Ngày sinh: ${data.dob}
      - Con số chủ đạo: ${data.lifePath}
      - Chỉ số sứ mệnh: ${data.expression}
      - Chỉ số linh hồn: ${data.soulUrge}
      - Chỉ số nhân cách: ${data.personality}
      Hãy viết một bản luận giải chi tiết, khích lệ và sâu sắc bằng tiếng Việt (Markdown).
    `;
  } else if (type === 'horoscope') {
    prompt = `
      Bạn là một bậc thầy Tử vi phương Đông. Hãy luận giải lá số cho:
      - Họ tên: ${data.name}
      - Ngày sinh: ${data.dob} (Dương lịch)
      - Giờ sinh: ${data.time}
      - Giới tính: ${data.gender}
      Phân tích tổng quan về bản mệnh, sự nghiệp, tài lộc và gia đạo. Viết bằng tiếng Việt (Markdown), giọng văn cổ điển nhưng dễ hiểu.
    `;
  } else if (type === 'birthchart') {
    prompt = `
      Bạn là một chuyên gia Chiêm tinh học phương Tây. Hãy phân tích bản đồ sao cho:
      - Ngày sinh: ${data.dob}
      - Giờ sinh: ${data.time}
      - Nơi sinh: ${data.place}
      Phân tích các hành tinh chính (Mặt trời, Mặt trăng, Điểm mọc) và các góc chiếu quan trọng. Viết bằng tiếng Việt (Markdown), phong cách hiện đại và tâm lý học.
    `;
  } else if (type === 'tarot') {
    prompt = `
      Bạn là một người đọc bài Tarot thấu cảm. Người dùng đã rút được các lá bài: ${data.cards.join(', ')}.
      Câu hỏi/Vấn đề của họ: ${data.question || "Tổng quan cuộc sống hiện tại"}
      Hãy luận giải ý nghĩa của trải bài này đối với vấn đề của họ. Viết bằng tiếng Việt (Markdown), giọng văn huyền bí và chữa lành.
    `;
  }

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    return response.text;
  } catch (error: any) {
    console.error("Error fetching interpretation:", error);
    return `Lỗi: ${error.message || "Dòng năng lượng đang bị nhiễu. Vui lòng kiểm tra cấu hình API Key."}`;
  }
}
