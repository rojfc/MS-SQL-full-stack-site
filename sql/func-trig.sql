USE shop;
GO

DROP PROCEDURE delete_sale_from_department;
GO
/* Procedure */
CREATE PROCEDURE delete_sale_from_department 
    @ProducerName NVARCHAR(20)
AS
BEGIN
    UPDATE Goods
    SET DESCRIPTION = isnull(DESCRIPTION,'') + N' Інформацію про продажі видалено'
    WHERE PRODUCER = @ProducerName;

    DELETE S FROM Sales S
    JOIN Goods G ON S.GOOD_ID = G.GOOD_ID
    WHERE G.PRODUCER = @ProducerName;
END;
GO

DROP FUNCTION CHEAPEST_GOOD_ON_DATE;
GO
/* Scalar function */
CREATE FUNCTION CHEAPEST_GOOD_ON_DATE
(
    @Date_of_good DATE,
    @Departament_id INT
)
RETURNS NVARCHAR(100)
AS
BEGIN
    DECLARE @Name_of_cheapest_good NVARCHAR(100)

    SET @Name_of_cheapest_good = (
        SELECT STRING_AGG(g_n.NAME, ', ') 
        FROM Goods g_n
        JOIN Sales s ON g_n.GOOD_ID = s.GOOD_ID
        WHERE s.DATE_SALE = @Date_of_good
        AND g_n.DEPT_ID = @Departament_id -- Filter by Dept here
        AND g_n.PRICE = (
            SELECT MIN(g_p.PRICE)
            FROM Goods g_p
            WHERE g_p.DEPT_ID = @Departament_id
        )
    )

    IF @Name_of_cheapest_good IS NULL
        SET @Name_of_cheapest_good = N'Товари не були реалізовані у '
        + CONVERT(NVARCHAR(20), @Date_of_good);

    RETURN @Name_of_cheapest_good;
END
GO

DROP FUNCTION GET_MOST_SOLD_GOODS_BY_EMPLOYEE;
GO
/* Table function */
CREATE OR ALTER FUNCTION GET_MOST_SOLD_GOODS_BY_EMPLOYEE
(  
    @EmployeeName nvarchar(100)
)  
RETURNS TABLE 
AS
RETURN 
(
    WITH EmployeeDept AS (
        SELECT TOP 1 DEPT_ID FROM Workers WHERE NAME = @EmployeeName
    ),
    SalesStats AS (
        SELECT 
            g.NAME, 
            SUM(s.QUANTITY) as TOTAL_QUANTITY
        FROM Goods g
        JOIN Sales s ON s.GOOD_ID = g.GOOD_ID
        WHERE g.DEPT_ID = (SELECT DEPT_ID FROM EmployeeDept)
        GROUP BY g.NAME
    )
    SELECT NAME, TOTAL_QUANTITY
    FROM SalesStats
    WHERE TOTAL_QUANTITY = (SELECT MAX(TOTAL_QUANTITY) FROM SalesStats)
);
GO

DROP TRIGGER dbo.tr_SalesLoging;
GO
/* Trigger */
CREATE TRIGGER dbo.tr_SalesLoging
ON dbo.Sales
AFTER INSERT
AS
BEGIN
    UPDATE good
        SET good.DESCRIPTION = ISNULL(good.DESCRIPTION, '')
            + ' / Check No: '
            + CAST(ins.CHECK_NO AS NVARCHAR(20))
    FROM dbo.Goods good
    INNER JOIN inserted ins ON good.GOOD_ID = ins.GOOD_ID;

    PRINT("Desctiption succesfully added in good");
END
GO

