import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** className 합성 (clsx + tailwind-merge). 컴포넌트에서 조건부/오버라이드 스타일용 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
