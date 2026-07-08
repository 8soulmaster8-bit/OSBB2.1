-- Проверка данных профилей (для отладки)
SELECT id, full_name, apartment_number, phone, role, square_meters, created_at 
FROM profiles 
ORDER BY created_at;