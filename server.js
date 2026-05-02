// server.js
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 兼容 CommonJS 的 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** 实验数据根目录（须与服务器磁盘上的真实文件夹一致）。其下会有 main_data、other_data。 */
const EXPERIMENT_DATA_ROOT = 'C:/SocialThreatUncertainRepresentation';

const app = express();
const port = 3000; // 端口号

// 启用 CORS，允许所有来源访问（本地开发用）
app.use(cors());

// 解析 application/json 类型的请求体
app.use(bodyParser.json({ limit: '50mb' })); // 增加限制以处理大型JSON文件

// 静态文件目录就是当前目录（与 server.js 同级的项目根）
const staticPath = __dirname;
app.use(express.static(staticPath));

// 根路径 '/' 提供 index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
});

// POST 路由：保存 CSV 实验数据
app.post('/save-experiment-data', (req, res) => {
    const data = req.body;
    if (!data || !data.filename || !data.csvContent) {
        return res.status(400).send('Invalid data format. Requires filename and csvContent.');
    }

    const filename = data.filename;
    const csvContent = data.csvContent;
    
    // 解析文件名以获取被试ID和块信息
    // 文件名格式: sub01_CH_Happy.csv 或 subA1B2_CH_Happy.csv -> 提取 subjectId, block
    const filenameMatch = filename.match(/sub([^_]+)_(.+)\.csv/);
    if (!filenameMatch) {
        return res.status(400).send('Invalid filename format. Expected: subSubjectID_BlockName.csv');
    }
    
    const subjectId = filenameMatch[1];
    const blockName = filenameMatch[2];
    
    // 创建新的文件名格式: sub01_RJ.csv 或 subA1B2_RJ.csv
    const newFilename = `sub${subjectId}_RJ.csv`;
    
    // 按块创建文件夹结构: experiment_data/CH_Happy/sub01_RJ.csv
    const baseDataDir = path.join(EXPERIMENT_DATA_ROOT, 'main_data');
    const blockDir = path.join(baseDataDir, blockName);

    if (!fs.existsSync(baseDataDir)) {
        fs.mkdirSync(baseDataDir, { recursive: true });
    }
    if (!fs.existsSync(blockDir)) {
        fs.mkdirSync(blockDir, { recursive: true });
    }

    const filePath = path.join(blockDir, newFilename);

    fs.writeFile(filePath, csvContent, (err) => {
        if (err) {
            console.error('Error saving data:', err);
            return res.status(500).send('Failed to save data.');
        }
        console.log(`✓ CSV文件保存成功: ${filePath}`);
        res.status(200).send('Data saved successfully.');
    });
});

// POST 路由：保存 JSON 实验数据
app.post('/save-json-data', (req, res) => {
    const data = req.body;
    if (!data || !data.filename || !data.jsonContent || !data.subjectId) {
        return res.status(400).send('Invalid data format. Requires filename, jsonContent, and subjectId.');
    }

    const filename = data.filename;
    const jsonContent = data.jsonContent;
    // const subjectId = data.subjectId; // 不再需要按被试分文件夹

    const baseDataDir = path.join(EXPERIMENT_DATA_ROOT, 'other_data'); // 统一保存到 other_data
    // const targetDir = path.join(baseDataDir, `subject_${String(subjectId).padStart(2, '0')}`); // 不再需要

    if (!fs.existsSync(baseDataDir)) {
        fs.mkdirSync(baseDataDir, { recursive: true });
    }

    const filePath = path.join(baseDataDir, filename);

    // 格式化 JSON 内容
    let formattedJsonContent;
    try {
        formattedJsonContent = JSON.stringify(JSON.parse(jsonContent), null, 2);
    } catch (e) {
        return res.status(400).json({
            success: false,
            message: 'Invalid JSON content.',
            error: e.message
        });
    }

    fs.writeFile(filePath, formattedJsonContent, 'utf8', (err) => {
        if (err) {
            console.error('Error saving JSON data:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to save JSON data.',
                error: err.message
            });
        }
        console.log(`✓ JSON文件保存成功: ${filePath}`);
        res.status(200).json({
            success: true,
            message: 'JSON data saved successfully.',
            filePath: filePath
        });
    });
});

// 启动服务器
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
