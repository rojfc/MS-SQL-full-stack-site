const express = require('express');
const sql = require('mssql');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const config = {
    user: 'sa',
    password: 'StrongP@ssw0rd!',
    server: 'localhost',
    database: 'shop',
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
    port: 1433
};

// Generic function to fetch table data
app.get('/api/:table', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request().query(`SELECT * FROM ${req.params.table}`);
        
        // Explicitly set the content type with UTF-8 encoding
        res.header("Content-Type", "application/json; charset=utf-8");
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/details/:table/:id', async (req, res) => {
    try {
        const { table, id } = req.params;
        let pool = await sql.connect(config);
        let details = { related: [] };

        const tableLower = table.toLowerCase();

        if (tableLower === 'departments') {
            const workers = await pool.request().input('id', id).query("SELECT * FROM Workers WHERE DEPT_ID = @id");
            const goods = await pool.request().input('id', id).query("SELECT * FROM Goods WHERE DEPT_ID = @id");
            details.related = [
                { title: "Workers in this Dept", data: workers.recordset },
                { title: "Goods in this Dept", data: goods.recordset }
            ];
        } 
        if (tableLower === 'workers') {
            // 1. Get Department
            const dept = await pool.request().input('id', id)
                .query("SELECT d.* FROM Departments d JOIN Workers w ON d.DEPT_ID = w.DEPT_ID WHERE w.WORKERS_ID = @id");
            details.related = [{ title: "Department", data: dept.recordset }];

            // 2. Get Worker Name and Run the SQL Function
            const workerInfo = await pool.request().input('id', id)
                .query("SELECT NAME FROM Workers WHERE WORKERS_ID = @id");
            
            if (workerInfo.recordset.length > 0) {
                const workerName = workerInfo.recordset[0].NAME;
                const stats = await pool.request()
                    .input('name', sql.NVarChar, workerName)
                    .query("SELECT * FROM dbo.GET_MOST_SOLD_GOODS_BY_EMPLOYEE(@name)");
                details.workerStats = stats.recordset;
            }
        }
        else if (tableLower === 'goods') {
            const dept = await pool.request().input('id', id)
                .query("SELECT d.* FROM Departments d JOIN Goods g ON d.DEPT_ID = g.DEPT_ID WHERE g.GOOD_ID = @id");
            const sales = await pool.request().input('id', id).query("SELECT * FROM Sales WHERE GOOD_ID = @id");
            details.related = [
                { title: "Department", data: dept.recordset },
                { title: "Sales History", data: sales.recordset }
            ];
        }
        else if (tableLower === 'sales') {
            const good = await pool.request().input('id', id)
                .query("SELECT g.* FROM Goods g JOIN Sales s ON g.GOOD_ID = s.GOOD_ID WHERE s.SALE_ID = @id");
            const dept = await pool.request().input('id', id)
                .query("SELECT d.* FROM Departments d JOIN Goods g ON d.DEPT_ID = g.DEPT_ID JOIN Sales s ON g.GOOD_ID = s.GOOD_ID WHERE s.SALE_ID = @id");
            
            details.related = [
                { title: "Product Sold", data: good.recordset },
                { title: "Sold by Department", data: dept.recordset }
            ];
        }

        res.json(details);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/:table/:pkColumn/:id', async (req, res) => {
    try {
        const { table, pkColumn, id } = req.params;
        let pool = await sql.connect(config);
        
        await pool.request()
            .input('id', sql.Int, id)
            .query(`DELETE FROM ${table} WHERE ${pkColumn} = @id`);
            
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/:table', async (req, res) => {
    try {
        const { table } = req.params;
        let data = { ...req.body }; 

        // Auto-inject current date for specific tables
        const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        if (table.toLowerCase() === 'sales' && !data.DATE_SALE) {
            data.DATE_SALE = now;
        }

        let pool = await sql.connect(config);
        const request = pool.request();
        
        const columns = Object.keys(data).join(', ');
        const values = Object.keys(data).map(key => `@${key}`).join(', ');
        
        Object.keys(data).forEach(key => {
            request.input(key, data[key]);
        });

        await request.query(`INSERT INTO ${table} (${columns}) VALUES (${values})`);
        
        res.json({ message: 'Added successfully', addedDate: data.DATE_SALE });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/procedures/delete-producer-sales', async (req, res) => {
    try {
        const { deptId } = req.body;
        
        if (!deptId) return res.status(400).json({ error: "Department ID is missing" });

        let pool = await sql.connect(config);
        
        // 1. Update Goods description to note sales were wiped
        // 2. Delete all sales for goods belonging to this department
        await pool.request()
            .input('DeptId', sql.Int, deptId)
            .query(`
                UPDATE Goods 
                SET DESCRIPTION = ISNULL(DESCRIPTION,'') + N' Всі продажі відділу видалено'
                WHERE DEPT_ID = @DeptId;

                DELETE S FROM Sales S
                JOIN Goods G ON S.GOOD_ID = G.GOOD_ID
                WHERE G.DEPT_ID = @DeptId;
            `);

        res.json({ message: `All sales for Department #${deptId} have been deleted.` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/reports/cheapest-goods', async (req, res) => {
    try {
        const { date } = req.query; 
        let pool = await sql.connect(config);

        // --- STEP A: Get the list of departments ---
        const deptsResult = await pool.request().query('SELECT DEPT_ID, NAME FROM Departments');
        const departments = deptsResult.recordset;

        // --- STEP B: Loop through departments and call the function for each ---
        const report = await Promise.all(departments.map(async (dept) => {
            const result = await pool.request()
                .input('TargetDate', sql.Date, date)
                .input('TargetDeptId', sql.Int, dept.DEPT_ID)
                .query(`SELECT dbo.CHEAPEST_GOOD_ON_DATE(@TargetDate, @TargetDeptId) as Result`);
            
            // We combine the Department Name with the result from the Function
            return {
                department: dept.NAME,
                goods: result.recordset[0].Result
            };
        }));

        // Send the full array of results back to the React frontend
        res.json(report);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(5000, () => console.log('Server running on port 5000'));
