// src/app/interfaces/menu-item.interface.ts

/**
 * Интерфейс для пункта меню
 */
export interface MenuItem {
  id: string;           // Уникальный идентификатор (home, terms, about и т.д.)
  label: string;        // Отображаемый текст ("Quizzes", "About" и т.д.)
  route: string;        // Маршрут Angular (/home, /about и т.д.)
  order: number;        // Порядок отображения
  isVisible: boolean;   // Показывать ли в меню
}

/**
 * Структура content для страницы menu-items
 */
export interface MenuItemsContent {
  items: MenuItem[];
}