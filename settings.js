// НАСТРОЙКИ ИГРЫ. Откройте этот файл в Блокноте.
// После сохранения обновите страницу игры. true — включено, false — выключено.
// Награда и штраф: целые числа от 0 до 1000 рублей (без знака минус).
window.EVA_CONFIG = {
  reward: 3,
  penalty: 2,
  topics: {
    "arithmetic": true,      // Сложение и вычитание
    "multiplication": true,  // Таблица умножения
    "division": true,        // Табличное деление
    "non-table": false,       // Внетабличные действия
    "operations": true,      // Порядок действий
    "equations": true,       // Уравнения
    "geometry": false,        // Геометрия
    "measurements": false,    // Единицы измерения
    "word-problems": false,   // Текстовые задачи
    "fractions": false        // Доли числа
  }
};
