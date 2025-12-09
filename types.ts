
export enum View {
  HOME = 'HOME',
  RESUME = 'RESUME',
  VISITING_CARD = 'VISITING_CARD',
  WHATSAPP_QR = 'WHATSAPP_QR',
  GENERAL_QR = 'GENERAL_QR'
}

export type ToolType = 'NAME' | 'CONTACT' | 'EXPERIENCE' | 'EDUCATION' | 'PROJECTS' | 'SKILLS' | 'IMAGE' | 'SHAPE' | 'TEXT' | 'LIST' | 'GALLERY';

export interface CanvasItemStyle {
  fontSize?: number;
  lineHeight?: number;
  fontFamily?: string;
  fontWeight?: 'bold' | 'normal';
  fontStyle?: 'italic' | 'normal';
  textDecoration?: 'underline' | 'line-through' | 'none';
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
  backgroundColor?: string;
  width?: number;
  height?: number;
  borderRadius?: number;
  borderColor?: string;
  borderWidth?: number;
  letterSpacing?: string;
  borderBottom?: string;
  textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase';
}

export interface CanvasItem {
  id: string;
  type: ToolType;
  x: number;
  y: number;
  data: any; // Dynamic based on type
  style?: CanvasItemStyle;
}

export interface CardData {
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  color: string;
}