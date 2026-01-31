
import React, { useState } from 'react';
import { Slide, ThemeConfig } from '../types';
import { ChevronLeft, ChevronRight, CheckCircle2, Image as ImageIcon, Sparkles, Download, HelpCircle, Award } from 'lucide-react';
import pptxgen from 'pptxgenjs';

interface SlideDeckProps {
  slides: Slide[];
  chapterTitle: string;
  theme: ThemeConfig;
}

export const SlideDeck: React.FC<SlideDeckProps> = ({ slides, chapterTitle, theme }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});

  const nextSlide = () => currentIndex < slides.length - 1 && setCurrentIndex(currentIndex + 1);
  const prevSlide = () => currentIndex > 0 && setCurrentIndex(currentIndex - 1);

  const exportToPPTX = async () => {
    setIsExporting(true);
    const pres = new pptxgen();
    pres.layout = 'LAYOUT_16x9';

    slides.forEach((slide, idx) => {
      const s = pres.addSlide();
      s.background = { color: theme.backgroundColor.replace('#', '') };

      // Diagonal Watermark for Brand Protection (on every slide)
      s.addText("VEDANTU", {
        x: 0, y: 1.5, w: 10, h: 3,
        fontSize: 100, color: theme.primaryColor.replace('#', ''), bold: true, align: 'center', opacity: 5, rotate: 330
      });

      // Bottom Watermark
      s.addText("Vedantu - Smart Learning Solution", {
        x: 0.5, y: 5.2, w: 9, h: 0.3,
        fontSize: 10, color: theme.primaryColor.replace('#', ''), bold: true, align: 'center', opacity: 30
      });

      if (slide.type === 'TITLE') {
        s.addText("VEDANTU", {
          x: 0, y: 1.5, w: 10, h: 3,
          fontSize: 120, color: theme.primaryColor.replace('#', ''), bold: true, align: 'center', opacity: 10
        });
        s.addText(slide.title, {
          x: 1, y: 2.2, w: 8, h: 1,
          fontSize: 44, bold: true, color: theme.primaryColor.replace('#', ''), align: 'center'
        });
      } else if (slide.type === 'QUIZ' && slide.quizData) {
        s.addText(`QUIZ: ${slide.title}`, {
          x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 18, bold: true, color: theme.primaryColor.replace('#', '')
        });
        s.addText(slide.quizData.question, {
          x: 0.5, y: 1.2, w: 9, h: 1.5, fontSize: 24, bold: true, color: theme.textColor.replace('#', '')
        });
        slide.quizData.options.forEach((opt, i) => {
          s.addText(`${String.fromCharCode(65+i)}) ${opt}`, {
            x: 0.8, y: 2.8 + (i * 0.5), w: 8.5, h: 0.4, fontSize: 16, color: theme.textColor.replace('#', '')
          });
        });
      } else {
        s.addText(slide.title, {
          x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 32, bold: true, color: theme.primaryColor.replace('#', '')
        });
        s.addText(slide.content, {
          x: 0.5, y: 1.5, w: 5, h: 2, fontSize: 14, color: theme.textColor.replace('#', '')
        });
        const points = slide.keyPoints.map(p => ({ text: p, options: { bullet: true, color: theme.textColor.replace('#', ''), fontSize: 12 } }));
        s.addText(points, { x: 0.5, y: 3.6, w: 5, h: 1.5 });
        if (slide.imageUrl) {
          s.addImage({ data: slide.imageUrl, x: 5.8, y: 1.2, w: 3.8, h: 3.5 });
        }
      }
    });

    await pres.writeFile({ fileName: `${chapterTitle}_Vedantu_Official.pptx` });
    setIsExporting(false);
  };

  const currentSlide = slides[currentIndex];

  const renderSlideContent = () => {
    // Watermark Overlay (shared for all slides)
    const WatermarkOverlay = () => (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none overflow-hidden z-0">
        <h1 className="text-[200px] font-black tracking-tighter -rotate-12" style={{ color: theme.primaryColor }}>VEDANTU</h1>
      </div>
    );

    if (currentSlide.type === 'TITLE') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center relative z-10">
          <WatermarkOverlay />
          <h1 className="text-6xl font-black mb-4 z-10" style={{ color: theme.primaryColor }}>{currentSlide.title}</h1>
          <p className="text-2xl font-bold opacity-60 z-10" style={{ color: theme.textColor }}>Class 10 CBSE | Smart Study Deck</p>
        </div>
      );
    }

    if (currentSlide.type === 'QUIZ' && currentSlide.quizData) {
      const q = currentSlide.quizData;
      const isAnswered = quizAnswers[currentSlide.id] !== undefined;
      const selected = quizAnswers[currentSlide.id];

      return (
        <div className="space-y-8 relative z-10 h-full">
          <WatermarkOverlay />
          <div className="flex items-center gap-3 relative z-10">
            <HelpCircle size={32} style={{ color: theme.primaryColor }} />
            <h3 className="text-3xl font-bold" style={{ color: theme.textColor }}>Quiz Challenge</h3>
          </div>
          <h4 className="text-2xl font-semibold leading-relaxed relative z-10" style={{ color: theme.textColor }}>{q.question}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
            {q.options.map((opt, i) => {
              const isCorrect = i === q.correctAnswer;
              const isSelected = selected === i;
              let btnStyle = { backgroundColor: 'white', borderColor: '#e5e7eb' };
              if (isAnswered) {
                if (isCorrect) btnStyle = { backgroundColor: '#f0fdf4', borderColor: '#22c55e' };
                else if (isSelected) btnStyle = { backgroundColor: '#fef2f2', borderColor: '#ef4444' };
              }

              return (
                <button
                  key={i}
                  disabled={isAnswered}
                  onClick={() => setQuizAnswers({ ...quizAnswers, [currentSlide.id]: i })}
                  className="p-5 rounded-2xl border-2 text-left font-medium text-lg transition-all hover:border-orange-200"
                  style={btnStyle}
                >
                  <span className="inline-block w-8 h-8 rounded-full border mr-3 text-center leading-7 text-sm font-bold opacity-40">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
          {isAnswered && (
            <div className="p-6 rounded-2xl animate-in fade-in slide-in-from-top-4 relative z-10" style={{ backgroundColor: `${theme.primaryColor}08` }}>
              <div className="font-bold mb-2 flex items-center gap-2" style={{ color: theme.primaryColor }}>
                <Award size={20} /> Explanation:
              </div>
              <p className="opacity-80" style={{ color: theme.textColor }}>{q.explanation}</p>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col md:flex-row gap-12 h-full relative z-10">
        <WatermarkOverlay />
        <div className="flex-1 space-y-6 relative z-10">
          <h3 className="text-4xl font-extrabold leading-tight" style={{ color: theme.primaryColor }}>{currentSlide.title}</h3>
          <p className="text-lg leading-relaxed opacity-80" style={{ color: theme.textColor }}>{currentSlide.content}</p>
          <div className="space-y-3">
            <h4 className="text-xl font-bold flex items-center gap-2" style={{ color: theme.textColor }}>
              <CheckCircle2 style={{ color: theme.primaryColor }} size={24} /> Key Concepts
            </h4>
            <ul className="space-y-2">
              {currentSlide.keyPoints.map((p, i) => (
                <li key={i} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                  <div className="w-2 h-2 mt-2 rounded-full shrink-0" style={{ backgroundColor: theme.primaryColor }}></div>
                  <span className="font-medium" style={{ color: theme.textColor }}>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex-1 relative z-10">
          {currentSlide.imageUrl ? (
            <div className="rounded-3xl overflow-hidden shadow-2xl border-4 bg-white h-full" style={{ borderColor: `${theme.primaryColor}20` }}>
              <img src={currentSlide.imageUrl} alt={currentSlide.title} className="w-full h-full object-contain" />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur px-3 py-1 rounded text-[10px] text-white font-bold tracking-widest uppercase">Labelled Concept Diagram</div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 text-gray-400">
              <ImageIcon size={48} className="mb-4 opacity-20" />
              <p className="font-bold">Educational Diagram Generating...</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 h-screen flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900">{chapterTitle}</h2>
          <div className="flex items-center gap-2 mt-1">
             <span className="text-xs font-bold px-2 py-0.5 rounded bg-orange-100 text-vedantu-orange uppercase tracking-widest">
                {currentSlide.type} SLIDE
             </span>
             <span className="text-sm text-gray-400 font-bold">{currentIndex + 1} / {slides.length}</span>
          </div>
        </div>
        <button
          onClick={exportToPPTX}
          disabled={isExporting}
          className="flex items-center gap-2 bg-vedantu-orange text-white px-8 py-4 rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-xl shadow-orange-100 disabled:opacity-50"
        >
          {isExporting ? <Sparkles size={20} className="animate-spin" /> : <Download size={20} />}
          {isExporting ? "Extracting PPT..." : "Extract PPTX"}
        </button>
      </div>

      <div className="flex-1 bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden relative flex flex-col">
        {/* Main Content Area */}
        <div className="flex-1 p-12 overflow-y-auto" style={{ backgroundColor: theme.backgroundColor }}>
          {renderSlideContent()}
        </div>

        {/* Persistent Bottom Branding Watermark */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-white/40 backdrop-blur-sm rounded-full pointer-events-none select-none border border-gray-100/50 z-20">
           <div className="w-5 h-5 rounded flex items-center justify-center text-white font-black text-[10px]" style={{ backgroundColor: theme.primaryColor }}>V</div>
           <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: theme.primaryColor }}>Vedantu - Smart Learning Solution</span>
        </div>

        {/* Footer Navigation */}
        <div className="bg-gray-50/80 backdrop-blur p-6 flex justify-between items-center border-t border-gray-100 z-20">
          <button
            onClick={prevSlide}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold bg-white text-gray-700 border border-gray-200 hover:border-vedantu-orange transition-all disabled:opacity-30"
          >
            <ChevronLeft size={20} /> Back
          </button>
          <div className="flex gap-2">
            {slides.map((_, idx) => (
              <div
                key={idx}
                className="w-2.5 h-2.5 rounded-full transition-all"
                style={{ backgroundColor: currentIndex === idx ? theme.primaryColor : '#e5e7eb', width: currentIndex === idx ? '24px' : '10px' }}
              />
            ))}
          </div>
          <button
            onClick={nextSlide}
            disabled={currentIndex === slides.length - 1}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white hover:opacity-90 transition-all shadow-lg disabled:opacity-30"
            style={{ backgroundColor: theme.primaryColor }}
          >
            {currentIndex === slides.length - 1 ? "End of Deck" : "Next Slide"} <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
