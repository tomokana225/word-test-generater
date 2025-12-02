
export interface WordPair {
    id: string;
    word: string;
    translation: string;
}

export interface WordList {
  id: string;
  name: string;
  createdAt: string;
  words: WordPair[];
}

export interface TestRange {
    id: string;
    name: string;
    startId: string;
    endId: string;
}

export interface GeneratedTestData {
    title: string;
    questions: Question[];
    answers: Answer[];
    audioBase64?: string; // For listening tests
    script?: string;      // For listening tests (answer key)
}

export interface QuestionConfig {
    translation: number;
    reverseTranslation: number;
    multipleChoice: number;
    fillInTheBlank: number;
    synonym: number;
    antonym: number;
}

export interface ListeningConfig {
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    questionCount: number;
    includeIllustrations: boolean;
    testCount: number; // Number of tests to generate
    theme?: string;    // Optional theme/topic
}

export interface Question {
    type: 'translation' | 'reverseTranslation' | 'multipleChoice' | 'fillInTheBlank' | 'synonym' | 'antonym' | 'listening' | 'listening-image';
    prompt?: string;
    promptWord?: string;
    options?: string[];
    imageOptions?: string[]; // Array of base64 image strings for options
    answer: string;
    wordId?: string; 
}

export interface Answer {
    questionIndex: number;
    answerText: string;
    wordId?: string;
}

export interface AppError {
    message: string;
    code: string;
}

export interface PageStyleSettings {
    fontSize: number;
    margin: number;
    lineHeight: number;
    questionSpacing: number;
    orientation: 'portrait' | 'landscape';
    paperSize: 'A4' | 'B5' | 'Letter';
    charsPerLine: number;
    linesPerPage: number;
}

export interface ElementStyles {
    // Text
    fontSize?: number;
    fontWeight?: 'normal' | 'bold';
    textAlign?: 'left' | 'center' | 'right';
    color?: string;
    textDecoration?: 'none' | 'underline';

    // Shape
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;

    // Wrapper div style
    border?: string;
}

export interface DraggableElementData {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    content: string; // for text, empty for shapes
    isEditing: boolean;
    type: 'text' | 'shape';
    shapeType?: 'rectangle' | 'circle';
    styles: ElementStyles;
    pageIndex: number;
}
