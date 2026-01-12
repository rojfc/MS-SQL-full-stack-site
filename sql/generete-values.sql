USE shop;
GO

DELETE FROM Sales;
DELETE FROM Workers;
DELETE FROM Goods;
DELETE FROM Departments;
GO

-- Insert 10 Departments
DECLARE @d int = 1;
WHILE (@d <= 10)
BEGIN
    INSERT INTO Departments (DEPT_ID, NAME, INFO)
    VALUES (@d, N'Відділ №' + CAST(@d AS nvarchar(5)), N'Опис відділу ' + CAST(@d AS nvarchar(5)));
    
    -- Insert 5 Workers for each Department (Total 50)
    DECLARE @w int = 1;
    WHILE (@w <= 5)
    BEGIN
        DECLARE @worker_id int = ((@d - 1) * 5) + @w;
        INSERT INTO Workers (WORKERS_ID, NAME, ADDRESS, DEPT_ID, INFORMATION)
        VALUES (@worker_id, N'Співробітник ' + CAST(@worker_id AS nvarchar(10)), 
                N'Вулиця ' + CAST(@worker_id AS nvarchar(10)), @d, N'Досвід: ' + CAST(@w AS nvarchar(2)));
        SET @w = @w + 1;
    END

    -- Insert 10 Goods for each Department (Total 100)
    DECLARE @g int = 1;
    WHILE (@g <= 10)
    BEGIN
        DECLARE @good_id int = ((@d - 1) * 10) + @g;
        INSERT INTO Goods (GOOD_ID, NAME, PRICE, QUANTITY, PRODUCER, DEPT_ID, DESCRIPTION)
        VALUES (@good_id, N'Товар ' + CAST(@good_id AS nvarchar(10)), 
                ABS(CHECKSUM(NEWID())) % 500 + 50, ABS(CHECKSUM(NEWID())) % 100, 
                N'Виробник ' + CAST(@d AS nvarchar(5)), @d, N'Опис товару ' + CAST(@good_id AS nvarchar(10)));
        
        -- Insert 2 Sales for each Good (Total 200)
        DECLARE @s int = 1;
        WHILE (@s <= 2)
        BEGIN
            DECLARE @sale_id int = ((@good_id - 1) * 2) + @s;
            INSERT INTO Sales (SALE_ID, CHECK_NO, GOOD_ID, DATE_SALE, QUANTITY)
            VALUES (@sale_id, 1000 + @sale_id, @good_id, 
                    DATEADD(day, - (ABS(CHECKSUM(NEWID())) % 30), GETDATE()), 
                    ABS(CHECKSUM(NEWID())) % 5 + 1);
            SET @s = @s + 1;
        END

        SET @g = @g + 1;
    END

    SET @d = @d + 1;
END
GO
