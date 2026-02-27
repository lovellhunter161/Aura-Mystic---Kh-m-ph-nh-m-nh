import React, { useState, useMemo, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Calendar, 
  User, 
  ArrowRight, 
  RefreshCw, 
  Star,
  Heart,
  Compass,
  LayoutGrid,
  Clock,
  MapPin,
  HelpCircle,
  ChevronLeft,
  Zap,
  History,
  Trash2,
  Share2,
  Copy,
  Check
} from 'lucide-react';
import Markdown from 'react-markdown';
import { Toaster, toast } from 'react-hot-toast';
import { 
  calculateLifePath, 
  calculateNameNumber, 
  getBirthChart 
} from './utils/numerology';
import { drawCards } from './utils/tarot';
import { getMysticInterpretation, MysticType } from './services/gemini';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Error Boundary ---
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-mystic-paper p-6 text-center">
          <div className="max-w-md space-y-4">
            <h1 className="text-2xl font-serif font-bold text-red-600">Đã xảy ra lỗi hệ thống</h1>
            <p className="text-stone-600">Ứng dụng gặp sự cố không mong muốn. Vui lòng thử tải lại trang.</p>
            <pre className="text-xs bg-stone-100 p-4 rounded-xl overflow-auto max-h-40 text-left">
              {this.state.error?.message}
            </pre>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-stone-900 text-white rounded-full text-sm font-medium"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Components ---

const ServiceCard = ({ id, title, description, icon: Icon, onClick }: any) => (
  <motion.button
    whileHover={{ scale: 1.02, y: -5 }}
    whileTap={{ scale: 0.98 }}
    onClick={() => onClick(id)}
    className="flex flex-col items-center text-center p-8 bg-white/60 backdrop-blur-md border border-stone-200 rounded-[40px] hover:border-mystic-accent/30 hover:bg-white/80 transition-all group"
  >
    <div className="p-4 bg-stone-100 rounded-2xl mb-6 group-hover:bg-mystic-accent/10 transition-colors">
      <Icon className="w-8 h-8 text-stone-600 group-hover:text-mystic-accent" />
    </div>
    <h3 className="text-xl font-serif font-bold mb-2">{title}</h3>
    <p className="text-sm text-stone-500 leading-relaxed">{description}</p>
  </motion.button>
);

const NumberCard = ({ label, value, description, icon: Icon, delay = 0 }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white/80 backdrop-blur-sm border border-stone-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all group"
  >
    <div className="flex items-start justify-between mb-4">
      <div className="p-2 bg-stone-100 rounded-xl group-hover:bg-mystic-accent/10 transition-colors">
        <Icon className="w-5 h-5 text-stone-600 group-hover:text-mystic-accent" />
      </div>
      <span className="text-4xl font-serif font-bold text-mystic-accent">{value}</span>
    </div>
    <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-500 mb-1">{label}</h3>
    <p className="text-xs text-stone-400 leading-relaxed">{description}</p>
  </motion.div>
);

const BirthChartGrid = ({ chart }: { chart: Record<number, number> }) => {
  const grid = [[3, 6, 9], [2, 5, 8], [1, 4, 7]];
  return (
    <div className="grid grid-cols-3 gap-2 w-full max-w-[240px] mx-auto aspect-square">
      {grid.flat().map((num) => (
        <div key={num} className={cn("flex flex-col items-center justify-center border border-stone-200 rounded-xl p-2 transition-all", chart[num] > 0 ? "bg-mystic-accent/5 border-mystic-accent/30" : "bg-stone-50/50")}>
          <span className="text-[10px] text-stone-400 font-mono mb-1">{num}</span>
          <div className="flex flex-wrap justify-center gap-0.5">
            {Array.from({ length: chart[num] }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-mystic-accent" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// --- Main App ---

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [view, setView] = useState<'home' | 'form' | 'result' | 'history'>('home');
  const [service, setService] = useState<MysticType | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [drawnCards, setDrawnCards] = useState<string[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [dailyVibe, setDailyVibe] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);

  const services = [
    { id: 'numerology', title: 'Thần số học', description: 'Khám phá bản thân qua các con số định mệnh từ họ tên và ngày sinh.', icon: Compass },
    { id: 'horoscope', title: 'Tử vi', description: 'Luận giải lá số Đông phương về vận mệnh, sự nghiệp và gia đạo.', icon: Star },
    { id: 'birthchart', title: 'Bản đồ sao', description: 'Phân tích vị trí các hành tinh lúc bạn chào đời theo Chiêm tinh Tây phương.', icon: LayoutGrid },
    { id: 'tarot', title: 'Tarot', description: 'Tìm kiếm câu trả lời và sự chỉ dẫn từ những lá bài huyền bí.', icon: Zap },
  ];

  useEffect(() => {
    loadHistory();
    loadDailyVibe();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await fetch('/api/history');
      if (!res.ok) throw new Error("Failed to fetch history");
      const data = await res.json();
      setHistory(data);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    }
  };

  const loadDailyVibe = async () => {
    try {
      const res = await fetch('/api/daily-vibe');
      if (!res.ok) throw new Error("Failed to fetch daily vibe");
      const data = await res.json();
      setDailyVibe(data.vibe);
    } catch (error) {
      console.error("Failed to fetch daily vibe:", error);
    }
  };

  const handleServiceSelect = (id: MysticType) => {
    setService(id);
    setView('form');
    setFormData({});
    setInterpretation(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);
    setView('result');

    let resultData: any = { ...formData };
    let summary = "";

    try {
      if (service === 'numerology') {
        resultData.lifePath = calculateLifePath(formData.dob);
        resultData.expression = calculateNameNumber(formData.name, 'expression');
        resultData.soulUrge = calculateNameNumber(formData.name, 'soul');
        resultData.personality = calculateNameNumber(formData.name, 'personality');
        resultData.birthChart = getBirthChart(formData.dob);
        summary = `Life Path: ${resultData.lifePath}`;
      } else if (service === 'tarot') {
        const cards = drawCards(3);
        setDrawnCards(cards);
        resultData.cards = cards;
        summary = cards.join(', ');
      } else {
        summary = `${formData.time || ''} ${formData.place || formData.gender || ''}`;
      }

      const aiResponse = await getMysticInterpretation(service!, resultData);
      setInterpretation(aiResponse || null);

      if (aiResponse) {
        await fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: service,
            name: formData.name || 'Ẩn danh',
            dob: formData.dob,
            result_summary: summary,
            interpretation: aiResponse
          })
        });
        loadHistory();
        toast.success("Giải mã thành công!");
      } else {
        throw new Error("Không nhận được kết quả từ vũ trụ");
      }
    } catch (error) {
      console.error("Analysis failed:", error);
      toast.error("Có lỗi xảy ra khi kết nối với vũ trụ.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const deleteHistoryItem = async (id: number) => {
    try {
      const res = await fetch(`/api/history/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to delete");
      loadHistory();
      toast.success("Đã xóa mục lịch sử");
    } catch (error) {
      console.error("Failed to delete history:", error);
      toast.error("Không thể xóa mục này");
    }
  };

  const copyToClipboard = () => {
    if (!interpretation) return;
    navigator.clipboard.writeText(interpretation);
    setIsCopied(true);
    toast.success("Đã sao chép vào bộ nhớ tạm");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const shareResult = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Aura Mystic Interpretation',
        text: interpretation || '',
        url: window.location.href,
      }).catch(console.error);
    } else {
      copyToClipboard();
    }
  };

  const goBack = () => {
    if (view === 'result' || view === 'history') setView('home');
    else if (view === 'form') setView('home');
  };

  return (
    <div className="min-h-screen bg-mystic-paper selection:bg-mystic-accent/20">
      <Toaster position="top-center" reverseOrder={false} />
      
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-mystic-accent blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-stone-400 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12 md:py-20">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-16"
            >
              <header className="text-center space-y-6">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-100 border border-stone-200 text-xs font-semibold uppercase tracking-widest text-stone-500"
                >
                  <Sparkles className="w-3 h-3" />
                  Cổng thông tin huyền bí
                </motion.div>
                <h1 className="text-6xl md:text-8xl font-serif font-light tracking-tight leading-none">
                  Aura <span className="italic">Mystic</span>
                </h1>
                <p className="text-stone-500 max-w-lg mx-auto text-lg font-serif italic">
                  "Hành trình thấu hiểu bản thân bắt đầu từ việc lắng nghe những tín hiệu của vũ trụ."
                </p>
                
                {dailyVibe && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md mx-auto p-4 bg-white/40 border border-stone-200 rounded-2xl text-sm italic text-stone-600 font-serif"
                  >
                    <span className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1 not-italic font-sans font-bold">Năng lượng hôm nay</span>
                    "{dailyVibe}"
                  </motion.div>
                )}

                <div className="flex justify-center pt-4">
                  <button 
                    onClick={() => setView('history')}
                    className="flex items-center gap-2 px-6 py-2 bg-white/50 border border-stone-200 rounded-full text-sm font-medium text-stone-600 hover:bg-white transition-all"
                  >
                    <History className="w-4 h-4" />
                    Lịch sử giải mã
                  </button>
                </div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {services.map((s) => (
                  <ServiceCard key={s.id} {...s} onClick={handleServiceSelect} />
                ))}
              </div>
            </motion.div>
          )}

          {view === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <button onClick={goBack} className="flex items-center gap-2 text-stone-400 hover:text-stone-600 transition-colors text-sm">
                <ChevronLeft className="w-4 h-4" /> Quay lại
              </button>

              <div className="text-center space-y-2">
                <h2 className="text-3xl font-serif font-bold">Lịch sử giải mã</h2>
                <p className="text-stone-500 text-sm">Những thông điệp vũ trụ bạn đã nhận được</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {history.length > 0 ? history.map((item) => (
                  <div key={item.id} className="bg-white/60 backdrop-blur-md border border-stone-200 p-6 rounded-3xl flex items-center justify-between group">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-mystic-accent/10 text-mystic-accent text-[10px] font-bold uppercase rounded-md">
                          {services.find(s => s.id === item.type)?.title}
                        </span>
                        <h4 className="font-serif font-bold text-lg">{item.name}</h4>
                      </div>
                      <p className="text-xs text-stone-400">{new Date(item.created_at).toLocaleString('vi-VN')}</p>
                      <p className="text-sm text-stone-600 italic">{item.result_summary}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setService(item.type);
                          setFormData({ name: item.name, dob: item.dob });
                          setInterpretation(item.interpretation);
                          setView('result');
                        }}
                        className="p-2 bg-stone-100 rounded-xl text-stone-500 hover:bg-mystic-accent hover:text-white transition-all"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteHistoryItem(item.id)}
                        className="p-2 bg-stone-100 rounded-xl text-stone-400 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-20 bg-white/40 rounded-[40px] border border-dashed border-stone-300">
                    <History className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                    <p className="text-stone-400 italic">Chưa có lịch sử giải mã nào.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {view === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-md mx-auto space-y-8"
            >
              <button onClick={goBack} className="flex items-center gap-2 text-stone-400 hover:text-stone-600 transition-colors text-sm">
                <ChevronLeft className="w-4 h-4" /> Quay lại
              </button>

              <div className="text-center space-y-2">
                <h2 className="text-3xl font-serif font-bold">{services.find(s => s.id === service)?.title}</h2>
                <p className="text-stone-500 text-sm">Vui lòng cung cấp thông tin để bắt đầu giải mã</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {(service === 'numerology' || service === 'horoscope') && (
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Họ và tên đầy đủ"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-white border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-mystic-accent/20 transition-all"
                      required
                    />
                  </div>
                )}

                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <input
                    type="date"
                    value={formData.dob || ''}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-mystic-accent/20 transition-all"
                    required
                  />
                </div>

                {(service === 'horoscope' || service === 'birthchart') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                      <input
                        type="time"
                        value={formData.time || ''}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-mystic-accent/20 transition-all"
                        required
                      />
                    </div>
                    {service === 'horoscope' ? (
                      <select
                        value={formData.gender || ''}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full px-4 py-4 bg-white border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-mystic-accent/20 transition-all appearance-none"
                        required
                      >
                        <option value="">Giới tính</option>
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                      </select>
                    ) : (
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                        <input
                          type="text"
                          placeholder="Nơi sinh"
                          value={formData.place || ''}
                          onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                          className="w-full pl-12 pr-4 py-4 bg-white border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-mystic-accent/20 transition-all"
                          required
                        />
                      </div>
                    )}
                  </div>
                )}

                {service === 'tarot' && (
                  <div className="relative">
                    <HelpCircle className="absolute left-4 top-4 w-5 h-5 text-stone-400" />
                    <textarea
                      placeholder="Câu hỏi hoặc vấn đề bạn đang quan tâm (Không bắt buộc)"
                      value={formData.question || ''}
                      onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-white border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-mystic-accent/20 transition-all min-h-[120px]"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-4 bg-stone-900 text-white rounded-2xl font-semibold hover:bg-mystic-accent transition-all flex items-center justify-center gap-2 group"
                >
                  Bắt đầu giải mã
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            </motion.div>
          )}

          {view === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-12"
            >
              <div className="flex items-center justify-between">
                <button onClick={goBack} className="flex items-center gap-2 text-stone-400 hover:text-stone-600 transition-colors text-sm">
                  <ChevronLeft className="w-4 h-4" /> Quay lại
                </button>
                <div className="text-right">
                  <h3 className="text-xl font-serif font-bold">{services.find(s => s.id === service)?.title}</h3>
                  <p className="text-stone-400 text-xs uppercase tracking-widest">Kết quả phân tích</p>
                </div>
              </div>

              {service === 'numerology' && !isAnalyzing && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <NumberCard label="Chủ đạo" value={calculateLifePath(formData.dob)} icon={Compass} description="Bản chất cuộc đời" />
                  <NumberCard label="Sứ mệnh" value={calculateNameNumber(formData.name, 'expression')} icon={Star} description="Tiềm năng thiên bẩm" />
                  <NumberCard label="Linh hồn" value={calculateNameNumber(formData.name, 'soul')} icon={Heart} description="Khát vọng thầm kín" />
                  <NumberCard label="Nhân cách" value={calculateNameNumber(formData.name, 'personality')} icon={User} description="Ấn tượng bên ngoài" />
                </div>
              )}

              {service === 'tarot' && !isAnalyzing && drawnCards.length > 0 && (
                <div className="flex flex-wrap justify-center gap-6">
                  {drawnCards.map((card, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20, rotateY: 90 }}
                      animate={{ opacity: 1, y: 0, rotateY: 0 }}
                      transition={{ delay: idx * 0.2 }}
                      className="w-32 h-52 bg-stone-900 rounded-xl border-2 border-mystic-accent/30 flex items-center justify-center text-center p-4 shadow-xl"
                    >
                      <span className="text-mystic-accent font-serif text-sm font-bold">{card}</span>
                    </motion.div>
                  ))}
                </div>
              )}

              <div className="relative prose prose-stone max-w-none bg-white/60 backdrop-blur-md border border-stone-200 p-8 md:p-12 rounded-[40px] shadow-sm">
                {interpretation && (
                  <div className="absolute top-6 right-6 flex gap-2">
                    <button 
                      onClick={copyToClipboard}
                      className="p-2 bg-stone-100 rounded-full text-stone-500 hover:bg-mystic-accent hover:text-white transition-all"
                      title="Sao chép"
                    >
                      {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={shareResult}
                      className="p-2 bg-stone-100 rounded-full text-stone-500 hover:bg-mystic-accent hover:text-white transition-all"
                      title="Chia sẻ"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {interpretation ? (
                  <div className="markdown-body animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <Markdown>{interpretation}</Markdown>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 space-y-6">
                    <div className="relative">
                      <RefreshCw className="w-12 h-12 text-mystic-accent animate-spin" />
                      <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-mystic-accent animate-pulse" />
                    </div>
                    <p className="text-stone-500 italic font-serif text-lg">Đang kết nối với các vì sao và những lá bài...</p>
                  </div>
                )}
              </div>

              <div className="flex justify-center">
                <button 
                  onClick={() => setView('home')}
                  className="px-8 py-3 bg-stone-100 text-stone-600 rounded-full text-sm font-semibold hover:bg-stone-200 transition-all"
                >
                  Về trang chủ
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="max-w-5xl mx-auto px-6 py-12 text-center border-t border-stone-200">
        <p className="text-stone-400 text-xs tracking-widest uppercase">
          © {new Date().getFullYear()} Aura Mystic • Khám Phá Định Mệnh
        </p>
      </footer>
    </div>
  );
}
