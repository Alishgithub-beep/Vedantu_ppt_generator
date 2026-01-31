
import React, { useState } from 'react';
import { Sparkles, BrainCircuit, Rocket, FileType, Layout, X, AlertTriangle } from 'lucide-react';
import { AppState, ChapterContent } from './types';
import { generateChapterContent, generateSlideImage } from './services/geminiService';
import { SlideDeck } from './components/SlideDeck';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [content, setContent] = useState<ChapterContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);

  const [chapterFile, setChapterFile] = useState<{ base64: string, name: string } | null>(null);
  const [styleFile, setStyleFile] = useState<{ base64: string, name: string, mimeType: string } | null>(null);

  const handleChapterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      setError("Please upload a PDF for the chapter content.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setChapterFile({ base64: (reader.result as string).split(',')[1], name: file.name });
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleStyleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setStyleFile({ base64: (reader.result as string).split(',')[1], name: file.name, mimeType: file.type });
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const startGeneration = async () => {
    if (!chapterFile) return setError("Please upload a chapter PDF first.");
    setAppState(AppState.UPLOADING);
    setError(null);
    setWarning(null);
    setProgress(10);

    try {
      setProgress(30);
      setAppState(AppState.GENERATING_CONTENT);
      const generatedContent = await generateChapterContent(chapterFile.base64, styleFile?.base64, styleFile?.mimeType);
      
      setContent(generatedContent);
      setProgress(60);
      setAppState(AppState.GENERATING_IMAGES);

      const updatedSlides = [];
      let failCount = 0;

      for (const slide of generatedContent.slides) {
        if (slide.type === 'CONTENT' && slide.imagePrompt) {
          try {
            await new Promise(r => setTimeout(r, 800));
            const imageUrl = await generateSlideImage(slide.imagePrompt, generatedContent.subject);
            updatedSlides.push({ ...slide, imageUrl });
          } catch (err) {
            updatedSlides.push(slide);
            failCount++;
          }
        } else {
          updatedSlides.push(slide);
        }
        setProgress(prev => Math.min(prev + (35 / generatedContent.slides.length), 95));
      }

      if (failCount > 0) setWarning(`Some educational diagrams could not be generated due to rate limits.`);
      setContent({ ...generatedContent, slides: updatedSlides });
      setAppState(AppState.VIEWING_DECK);
      setProgress(100);
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again later.");
      setAppState(AppState.IDLE);
    }
  };

  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 animate-in fade-in duration-700">
      <div className="relative mb-8">
        <div className="w-32 h-32 border-4 border-gray-100 rounded-full flex items-center justify-center">
          <div className="w-24 h-24 border-4 border-t-vedantu-orange border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin absolute top-4 left-4"></div>
          <BrainCircuit size={48} className="text-vedantu-orange animate-pulse" />
        </div>
      </div>
      <h2 className="text-3xl font-bold text-gray-800 mb-4">Building Your Vedantu Deck...</h2>
      <div className="w-full max-w-lg bg-gray-100 rounded-full h-4 overflow-hidden mb-12">
        <div className="bg-vedantu-orange h-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );

  const renderIdle = () => (
    <div className="max-w-6xl mx-auto px-4 py-16 flex flex-col lg:flex-row items-center gap-16 animate-in fade-in slide-in-from-bottom-8">
      <div className="flex-1 space-y-8 text-center lg:text-left">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-100 rounded-full text-vedantu-orange font-bold text-sm uppercase tracking-widest">
          <Sparkles size={16} /> Vedantu Smart PPT Gen
        </div>
        <h1 className="text-6xl font-black text-gray-900 leading-[1.1]">AI-Crafted <br /><span className="text-vedantu-orange">Study Decks</span></h1>
        <p className="text-xl text-gray-600 leading-relaxed max-w-xl">
          Upload your Class 10 chapter and a style sample. We'll generate a complete PPT with title branding, labelled diagrams, and a 5-MCQ quiz.
        </p>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-8 rounded-[2rem] border-2 border-dashed transition-all ${chapterFile ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:border-vedantu-orange'}`}>
              <FileType size={32} className="mb-4 text-vedantu-orange" />
              <h3 className="font-black text-xl mb-2">Chapter PDF</h3>
              {chapterFile ? (
                <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-green-100">
                  <span className="text-sm font-bold truncate max-w-[120px]">{chapterFile.name}</span>
                  <button onClick={() => setChapterFile(null)}><X size={18} /></button>
                </div>
              ) : (
                <label className="block w-full text-center py-4 bg-gray-50 rounded-2xl font-black cursor-pointer hover:bg-gray-100 transition-colors">
                  Upload PDF <input type="file" className="hidden" accept=".pdf" onChange={handleChapterUpload} />
                </label>
              )}
            </div>
            <div className={`p-8 rounded-[2rem] border-2 border-dashed transition-all ${styleFile ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:border-blue-400'}`}>
              <Layout size={32} className="mb-4 text-blue-500" />
              <h3 className="font-black text-xl mb-2">Style Sample</h3>
              {styleFile ? (
                <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-blue-100">
                  <span className="text-sm font-bold truncate max-w-[120px]">{styleFile.name}</span>
                  <button onClick={() => setStyleFile(null)}><X size={18} /></button>
                </div>
              ) : (
                <label className="block w-full text-center py-4 bg-gray-50 rounded-2xl font-black cursor-pointer hover:bg-gray-100 transition-colors">
                  Upload Sample <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleStyleUpload} />
                </label>
              )}
            </div>
          </div>
          <button onClick={startGeneration} disabled={!chapterFile} className="w-full py-6 bg-vedantu-orange text-white rounded-[2rem] font-black text-2xl hover:bg-orange-600 transition-all shadow-2xl shadow-orange-100 disabled:opacity-50">
            Generate Unified PPT
          </button>
        </div>
      </div>
      <div className="flex-1 bg-white p-12 rounded-[3rem] shadow-2xl border border-gray-50">
        <div className="aspect-video bg-gray-100 rounded-3xl mb-6 flex items-center justify-center text-gray-400 font-black text-2xl">TITLE SLIDE PREVIEW</div>
        <div className="h-4 w-3/4 bg-gray-100 rounded-full mb-4"></div>
        <div className="h-4 w-1/2 bg-gray-50 rounded-full"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-vedantu-orange rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-200">V</div>
          <div>
             <span className="text-xl font-black text-gray-900">VedaSmart</span>
             <span className="block text-[10px] font-bold text-vedantu-orange tracking-widest uppercase -mt-1">PPT SOLUTION</span>
          </div>
        </div>
        <button className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all flex items-center gap-2" onClick={() => window.location.reload()}>
          <Rocket size={18} /> New Deck
        </button>
      </nav>

      <main className="flex-1">
        {error && <div className="max-w-xl mx-auto mt-8 p-6 bg-red-50 text-red-600 rounded-3xl text-center font-bold flex items-center justify-center gap-4">{error} <button onClick={() => setError(null)}><X size={20} /></button></div>}
        {warning && <div className="max-w-2xl mx-auto mt-8 p-4 bg-yellow-50 text-yellow-800 rounded-2xl flex items-center justify-between gap-4 font-bold"><div className="flex items-center gap-3"><AlertTriangle size={20} /> {warning}</div><button onClick={() => setWarning(null)}><X size={16} /></button></div>}
        {appState === AppState.IDLE && renderIdle()}
        {appState !== AppState.IDLE && appState !== AppState.VIEWING_DECK && renderLoading()}
        {appState === AppState.VIEWING_DECK && content && <SlideDeck slides={content.slides} chapterTitle={content.chapterTitle} theme={content.theme} />}
      </main>

      <footer className="py-12 text-center text-gray-400 text-sm font-bold uppercase tracking-widest border-t border-gray-100">
         © 2024 Vedantu Innovations Pvt. Ltd. | AI Laboratory
      </footer>
    </div>
  );
};

export default App;
