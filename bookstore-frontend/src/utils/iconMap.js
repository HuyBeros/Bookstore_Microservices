import {
  BookOpen,
  Sparkles,
  Briefcase,
  Baby,
  FlaskConical,
  Brain,
  Landmark,
  Languages,
  Laugh,
  Cpu,
  Book,
} from 'lucide-react';

export const ICON_MAP = {
  BookOpen,
  Sparkles,
  Briefcase,
  Baby,
  FlaskConical,
  Brain,
  Landmark,
  Languages,
  Laugh,
  Cpu,
};

/**
 * Trả về component icon theo tên chuỗi.
 * Nếu tên không có trong map, trả về icon Book mặc định.
 */
export function getIcon(name) {
  return ICON_MAP[name] || Book;
}
