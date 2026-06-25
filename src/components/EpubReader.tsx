import { useState, useEffect } from 'react';
import { ReactReader, ReactReaderStyle } from 'react-reader';
import { X } from 'lucide-react';

interface EpubReaderProps {
  file: File;
  onClose: () => void;
}

const darkReaderTheme = {
  ...ReactReaderStyle,
  readerArea: {
    ...ReactReaderStyle.readerArea,
    backgroundColor: '#0f172a',
  },
  container: {
    ...ReactReaderStyle.container,
    backgroundColor: '#0f172a',
  },
  tocArea: {
    ...ReactReaderStyle.tocArea,
    backgroundColor: '#1e293b',
    color: '#f1f5f9',
  },
  tocButtonExpanded: {
    ...ReactReaderStyle.tocButtonExpanded,
    backgroundColor: '#334155',
  },
  tocButtonBar: {
    ...ReactReaderStyle.tocButtonBar,
    background: '#f1f5f9',
  },
};

export function EpubReader({ file, onClose }: EpubReaderProps) {
  const [location, setLocation] = useState<string | number>(0);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);

  useEffect(() => {
    const loadFile = async () => {
      const data = await file.arrayBuffer();
      setBuffer(data);
    };
    loadFile();
  }, [file]);

  const getRendition = (rendition: any) => {
    rendition.themes.register('dark', {
      body: {
        background: '#0f172a !important',
        color: '#f1f5f9 !important',
      },
      p: {
        color: '#f1f5f9 !important',
        fontSize: '18px !important',
        lineHeight: '1.6 !important',
      },
      h1: { color: '#f8fafc !important' },
      h2: { color: '#f8fafc !important' },
      h3: { color: '#f8fafc !important' },
      a: { color: '#3b82f6 !important' },
    });
    rendition.themes.select('dark');
  };

  if (!buffer) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-surface-900 relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 glass-panel !rounded-none !border-x-0 !border-t-0 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            title="Close Book"
          >
            <X size={24} className="text-slate-300" />
          </button>
          <div className="font-medium text-slate-200 truncate max-w-[200px] md:max-w-md">
            {file.name}
          </div>
        </div>
      </div>

      {/* Reader Area */}
      <div className="flex-1 relative pt-16">
        <ReactReader
          url={buffer}
          title={file.name}
          location={location}
          locationChanged={(epubcifi: string) => setLocation(epubcifi)}
          getRendition={getRendition}
          epubOptions={{
            flow: 'paginated',
            manager: 'continuous'
          }}
          readerStyles={darkReaderTheme}
        />
      </div>
    </div>
  );
}
