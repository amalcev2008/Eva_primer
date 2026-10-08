// НАСТРОЙКИ ИГРЫ. Откройте этот файл в Блокноте.
// После сохранения обновите страницу игры. true — включено, false — выключено.
// Награда и штраф: целые числа от 0 до 1000 рублей (без знака минус).
window.EVA_CONFIG = {
  reward: 2,
  penalty: 4,
  topics: {
    "arithmetic": true,      // Сложение и вычитание
    "multiplication": true,  // Таблица умножения
    "division": true,        // Табличное деление
    "non-table": true,       // Внетабличные действия
    "operations": true,      // Порядок действий
    "equations": true,       // Уравнения
    "geometry": true,        // Геометрия
    "measurements": true,    // Единицы измерения
    "word-problems": true,   // Текстовые задачи
    "fractions": false        // Доли числа
  }
};
