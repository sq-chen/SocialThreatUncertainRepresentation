// script/experiment.js

// 导入工具函数，例如 generatePlaces 和 shuffleArray
import { generatePlaces, shuffleArray } from './utils.js';
// 导入 VAS 评分函数
import { getVASRating } from './vas.js';

// 模拟 MATLAB 的 p 结构体，用于存储实验配置和数据
let p = {}; // p 现在是全局变量，在 initializeExperiment 中被赋值

// 全局变量，用于存储 Canvas 2D 上下文和预加载的刺激
let globalCtx = null;
let globalLoadedStimuli = null;

/**
 * 初始化实验环境（模拟 ptbInit）。
 * 此函数现在只负责初始化全局 p 对象。
 * @param {number} subjectId - 被试ID。
 * @param {Map<string, HTMLImageElement>} loadedStimuli - 预加载的刺激图片Map。
 */
export function initializeExperiment(subjectId, loadedStimuli) {
    const canvas = document.getElementById('experimentCanvas');
    globalCtx = canvas.getContext('2d'); // 将 ctx 赋值给全局变量
    globalLoadedStimuli = loadedStimuli; // 将 loadedStimuli 赋值给全局变量

    // 设置 canvas 尺寸以匹配窗口大小（响应式）
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // 确保 Canvas 尺寸在调整窗口时也能更新
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        // 重新绘制所有元素以适应新尺寸
        if (globalCtx) { // 确保 globalCtx 已经定义
            // 简单的清空和重绘固定点，并设置背景色
            globalCtx.fillStyle = 'rgb(122, 122, 122)'; // 设置为灰色背景
            globalCtx.fillRect(0, 0, p.w.width, p.w.height);
            globalCtx.fillStyle = 'black'; // 固定点颜色
            globalCtx.beginPath();
            globalCtx.arc(p.ptb.mid[0], p.ptb.mid[1], p.ptb.fix_r, 0, Math.PI * 2);
            globalCtx.fill();
        }
    });

    // 直接给全局 p 对象赋值
    p.subject = subjectId;
    p.date = new Date().toLocaleString(); // 添加日期，与 MATLAB 的 p.date 保持一致
    p.w = canvas; // 存储 canvas 元素

    // 获取 canvas 中心点
    const x = canvas.width / 2;
    const y = canvas.height / 2;

    p.ptb = {};
    p.ptb.places = generatePlaces(x, y); // 生成面部显示位置

    // 模拟 MATLAB 中的其他 ptbInit 设置
    p.ptb.mid = [x, y];
    p.ptb.fix_r = 4; // 调整：注视点半径改小 (从 8 变为 4)
    p.ptb.fix = [x - p.ptb.fix_r, y - p.ptb.fix_r, x + p.ptb.fix_r, y + p.ptb.fix_r]; // 固定点坐标
    p.ptb.faceSize = [72, 90]; // 调整：面部刺激的绘制尺寸 [宽度, 高度]

    // 实验参数配置 - 便于修改
    const EXPERIMENT_CONFIG = {
        nblocks: 4,           // 实验块数
        nrep: 5,              // 重复次数
        nlevel: 18,           // 水平数
        levelStart: 11,       // 水平起始值
        levelEnd: 28,         // 水平结束值
        proportionMin: 10,    // 比例最小值（百分比）
        proportionMax: 90,    // 比例最大值（百分比）
        vasInitMax: 100       // VAS初始值最大值
    };

    // 实验参数 - 修改为支持整个实验（CH + AF，共4个块）
    p.exp = {
        nblocks: EXPERIMENT_CONFIG.nblocks,
        nrep: EXPERIMENT_CONFIG.nrep,
        nlevel: EXPERIMENT_CONFIG.nlevel,
        ntrials: EXPERIMENT_CONFIG.nlevel * EXPERIMENT_CONFIG.nrep,
        ntrialstot: EXPERIMENT_CONFIG.nlevel * EXPERIMENT_CONFIG.nrep * EXPERIMENT_CONFIG.nblocks,
        condlabs: [], // 实验条件标签，将在下面设置
        levels: Array.from({length: EXPERIMENT_CONFIG.nlevel}, (_, i) => i + EXPERIMENT_CONFIG.levelStart),
        // proportion 和 vasInit 内部仍是0索引用于随机生成
        proportion: Array.from({length: EXPERIMENT_CONFIG.nblocks}, () => 
            Array.from({length: EXPERIMENT_CONFIG.nlevel * EXPERIMENT_CONFIG.nrep}, () => 
                Math.floor(Math.random() * (EXPERIMENT_CONFIG.proportionMax - EXPERIMENT_CONFIG.proportionMin + 1) + EXPERIMENT_CONFIG.proportionMin) / 100
            )
        ),
        facepoolnum: Array.from({length: EXPERIMENT_CONFIG.nblocks}, () => []),
        vasInit: Array.from({length: EXPERIMENT_CONFIG.nblocks}, () => 
            Array.from({length: EXPERIMENT_CONFIG.nlevel * EXPERIMENT_CONFIG.nrep}, () => 
                Math.floor(Math.random() * (EXPERIMENT_CONFIG.vasInitMax + 1))
            )
        ),
    };

    // 根据被试ID设置完整的实验条件顺序
    if (subjectId % 2 === 0) {
        // 偶数ID：先 AF 实验，再 CH 实验
        // AF 实验：愤怒面孔 -> 开心面孔
        // CH 实验：开心面孔 -> 愤怒面孔
        p.exp.condlabs = ['Angry_AF', 'Happy_AF', 'Happy_CH', 'Angry_CH'];
    } else {
        // 奇数ID：先 CH 实验，再 AF 实验
        // CH 实验：愤怒面孔 -> 开心面孔
        // AF 实验：开心面孔 -> 愤怒面孔
        p.exp.condlabs = ['Angry_CH', 'Happy_CH', 'Happy_AF', 'Angry_AF'];
    }

    // 模拟 MATLAB 中的 p.keys
    p.keys = {
        confirm: 'Enter', // 对应回车键
        space: 'Space',   // 对应空格键
        esc: 'Escape'     // 对应 ESC 键
    };

    // 模拟 MATLAB 中的 p.vas
    p.vas = {
        hl: 500, // 评分条长度
        cposmaxl: [x - 250, y + 25, x - 250, y + 125], // 评分条左端点
        cposmaxr: [x + 250, y + 25, x + 250, y + 125], // 评分条右端点
    };

    // 模拟 MATLAB 中的 p.out
    p.out = {
        trials: {}, // 用于存储试次数据，键为块名称（例如 'Happy_CH', 'Angry_AF'）
        // 模拟 MATLAB 的 p.out.t 矩阵，存储时间戳
        // 维度: [时间戳类型 (5), 块索引 (nblocks), 试次索引 (ntrials)]
        // JS 数组索引: [块索引][试次索引][时间戳类型]
        t: Array.from({length: p.exp.nblocks}, () =>
            Array.from({length: p.exp.ntrials}, () =>
                Array(5).fill(NaN) // 5种时间戳类型：fixation, facesPool, IRI, rating, ITI
            )
        )
    };

    // 随机化 facepoolnum - 为所有块分别生成
    const ntm = p.exp.ntrials;
    const lev = p.exp.levels;
    
    for (let block = 0; block < EXPERIMENT_CONFIG.nblocks; block++) {
        const rpp = shuffleArray(Array.from({length: ntm}, (_, i) => lev[i % lev.length]));
        p.exp.facepoolnum[block] = rpp.map(val => val);
    }
}

// 在文件顶部添加drawParagraph函数
function drawParagraph(ctx, text, x, y, maxWidth, lineHeight, indentPx = 0) {
    // 首行缩进：用indentPx像素的空白
    const words = text.split(''); // 按字符分割，因为中文没有空格分隔单词
    let line = '';
    let isFirstLine = true;
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n];
        // 计算当前行宽度
        let metrics = ctx.measureText(testLine);
        let offsetX = isFirstLine ? indentPx : 0;
        if (metrics.width + offsetX > maxWidth && n > 0) {
            ctx.fillText(line, x + (isFirstLine ? indentPx : 0), y);
            line = words[n];
            y += lineHeight;
            isFirstLine = false;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x + (isFirstLine ? indentPx : 0), y);
    return y + lineHeight;
}

/**
 * 模拟 MATLAB 的 ShowInstructions 函数。
 * 在 Canvas 上绘制指导语文本。
 * @returns {Promise<void>}
 */
export async function ShowInstructions() {
    // 清空画布并设置背景色
    globalCtx.fillStyle = 'rgb(122, 122, 122)';
    globalCtx.fillRect(0, 0, p.w.width, p.w.height);

    globalCtx.fillStyle = 'black'; // 文本颜色
    globalCtx.textAlign = 'left'; // 改为左对齐
    globalCtx.textBaseline = 'top'; // 用top更方便排版

    const marginX = 100; // 左右边距
    const maxWidth = p.w.width - marginX * 2;
    const tabPx = 48; // 一个tab宽度（可根据字体大小调整）
    let currentY = p.w.height / 2 - 250 - 50;

    // 标题居中
    globalCtx.fillStyle = 'black'; // 文本颜色
    // 设置标题居中
    globalCtx.textAlign = 'center'; // 改为居中
    globalCtx.font = 'bold 45px Arial';
    // 计算标题的水平中心位置（画布中心）
    const centerX = p.w.width / 2;
    // 绘制标题（居中）
    globalCtx.fillText('指导语', centerX, currentY);
    currentY += 70;
    globalCtx.textAlign = 'left'; // 恢复左对齐

    // 欢迎语
    globalCtx.font = '25px Arial';
    currentY = drawParagraph(globalCtx, '欢迎参加本实验！', marginX, currentY, maxWidth, 70, tabPx);

    // 实验要求段落
    globalCtx.font = '25px Arial';
    const mainInstructionText = '本实验要求判断不同情绪的面孔（愤怒/开心）对应的概率。每次屏幕中央及周围会随机呈现若干个不同情绪的面孔，你需要认真辨别各类面孔的数量并估计该类面孔占总人数的概率。之后，屏幕会出现一个滑动条（从0%-100%）。此时，你需要报告估计的概率，通过移动鼠标将红色光标放置到对应的概率后点击鼠标左键进行确认。';
    currentY = drawParagraph(globalCtx, mainInstructionText, marginX, currentY, maxWidth, 70, tabPx);

    // 小节开始提醒
    const text6 = '每小节开始前，屏幕中央会提醒接下来需要判断概率的面孔类型（愤怒/开心）。';
    currentY = drawParagraph(globalCtx, text6, marginX, currentY, maxWidth, 70, tabPx);

    // 准确率说明
    const text7 = '请尽可能准确地估计概率，准确率将决定报酬的高低。';
    currentY = drawParagraph(globalCtx, text7, marginX, currentY, maxWidth, 70, tabPx);

    // 开始提示
    const text8 = '明白实验要求后，按空格键开始实验。若有疑问，请联系主试！';
    globalCtx.font = 'bold 25px Arial';
    currentY = drawParagraph(globalCtx, text8, marginX, currentY, maxWidth, 70, tabPx);

    return new Promise(resolve => {
        const listener = (event) => {
            if (event.code === p.keys.space) {
                document.removeEventListener('keydown', listener);
                resolve();
            }
        };
        document.addEventListener('keydown', listener);
    });
}

/**
 * 模拟 MATLAB 的 ShowBlockAnnounce 函数。
 * 在 Canvas 上绘制块开始提示文本。
 * @param {string} blockName - 当前块的名称 (例如 'Happy_CH', 'Angry_CH')。
 * @returns {Promise<void>}
 */
async function ShowBlockAnnounce(blockName) {
    // 清空画布并设置背景色
    globalCtx.fillStyle = 'rgb(122, 122, 122)';
    globalCtx.fillRect(0, 0, p.w.width, p.w.height);

    globalCtx.fillStyle = 'black'; // 文本颜色
    globalCtx.font = 'bold 36px Arial'; // 字体大一点，加粗
    globalCtx.textAlign = 'center';
    globalCtx.textBaseline = 'middle';

    const centerX = p.w.width / 2;
    let currentY = p.w.height / 2 - 50;

    let blockTypeText = '';
    if (blockName.includes('Happy')) {
        blockTypeText = '开心面孔';
    } else if (blockName.includes('Angry')) {
        blockTypeText = '愤怒面孔';
    }

    globalCtx.fillText(`本小节请准确估计${blockTypeText}的概率`, centerX, currentY);
    currentY += 80; // 增加行距

    globalCtx.font = '30px Arial'; // 稍小一点的字体
    globalCtx.fillText('按空格键开始实验', centerX, currentY);

    return new Promise(resolve => {
        const listener = (event) => {
            if (event.code === p.keys.space) {
                document.removeEventListener('keydown', listener);
                resolve();
            }
        };
        document.addEventListener('keydown', listener);
    });
}

/**
 * 模拟 MATLAB 的 RunTrial 函数。
 * @param {number} trialIndex - 当前试次的索引（从0开始）。
 * @param {number} blockIndex - 当前块的索引（从0开始）。
 * @returns {Promise<void>}
 */
async function RunTrial(trialIndex, blockIndex) {
    // 1. 呈现注视点 (Fixation)
    globalCtx.fillStyle = 'rgb(122, 122, 122)';
    globalCtx.fillRect(0, 0, p.w.width, p.w.height);
    globalCtx.fillStyle = 'black';
    globalCtx.beginPath();
    globalCtx.arc(p.ptb.mid[0], p.ptb.mid[1], p.ptb.fix_r + 20, 0, Math.PI * 2); // 绘制大圆圈
    globalCtx.fill();
    // 记录注视点呈现时间
    p.out.t[blockIndex][trialIndex][0] = performance.now();

    // 2. 呈现面部池 (Faces Pool)
    // 清空画布并设置背景色
    globalCtx.fillStyle = 'rgb(122, 122, 122)';
    globalCtx.fillRect(0, 0, p.w.width, p.w.height);

    const faceNum = p.exp.facepoolnum[blockIndex][trialIndex];
    const proportion = p.exp.proportion[blockIndex][trialIndex];
    const target_num = Math.round(faceNum * proportion);
    const nontarget_num = faceNum - target_num;
    const objective_p = target_num / faceNum;

    let targetPool = [];
    let nontargetPool = [];

    const currentBlockName = p.exp.condlabs[blockIndex];
    const currentEthnicPrefix = currentBlockName.includes('CH') ? 'CH' : 'AF';
    const genders = ['F', 'M'];

    let happyFaces = [];
    let angryFaces = [];

    genders.forEach(gender => {
        for (let i = 1; i <= 8; i++) {
            const numStr = String(i).padStart(2, '0');
            const happyPath = `stimuli/${currentEthnicPrefix}_H_${gender}_${numStr}.png`;
            const angryPath = `stimuli/${currentEthnicPrefix}_A_${gender}_${numStr}.png`;

            const happyImg = globalLoadedStimuli.get(happyPath); // 使用全局 loadedStimuli
            const angryImg = globalLoadedStimuli.get(angryPath); // 使用全局 loadedStimuli

            if (happyImg) {
                happyFaces.push(happyImg);
            }
            if (angryImg) {
                angryFaces.push(angryImg);
            }
        }
    });

    happyFaces = happyFaces.filter(img => img !== undefined);
    angryFaces = angryFaces.filter(img => img !== undefined);

    if (currentBlockName.includes('Angry')) {
        targetPool = angryFaces;
        nontargetPool = happyFaces;
    } else if (currentBlockName.includes('Happy')) {
        targetPool = happyFaces;
        nontargetPool = angryFaces;
    }

    let targetFaces = [];
    for (let i = 0; i < target_num; i++) {
        targetFaces.push(targetPool[Math.floor(Math.random() * targetPool.length)]);
    }
    let nontargetFaces = [];
    for (let i = 0; i < nontarget_num; i++) {
        nontargetFaces.push(nontargetPool[Math.floor(Math.random() * nontargetPool.length)]);
    }

    let facesPool = shuffleArray([...targetFaces, ...nontargetFaces]);
    let locationIndices = shuffleArray(Array.from({length: 28}, (_, i) => i));

    const faceWidth = p.ptb.faceSize[0];
    const faceHeight = p.ptb.faceSize[1];

    for (let i = 0; i < facesPool.length; i++) {
        const faceImg = facesPool[i];
        const placeRect = p.ptb.places[locationIndices[i]];
        if (faceImg && placeRect) {
            const originalWidth = placeRect[2] - placeRect[0];
            const originalHeight = placeRect[3] - placeRect[1];
            const drawX = placeRect[0] + (originalWidth - faceWidth) / 2;
            const drawY = placeRect[1] + (originalHeight - faceHeight) / 2;

            globalCtx.drawImage(faceImg, drawX, drawY, faceWidth, faceHeight);
        }
    }

    // 绘制中心固定十字
    globalCtx.strokeStyle = 'black';
    globalCtx.lineWidth = 5;
    globalCtx.beginPath();
    globalCtx.moveTo(p.ptb.mid[0], p.ptb.mid[1] - 20);
    globalCtx.lineTo(p.ptb.mid[0], p.ptb.mid[1] + 20);
    globalCtx.moveTo(p.ptb.mid[0] - 20, p.ptb.mid[1]);
    globalCtx.lineTo(p.ptb.mid[0] + 20, p.ptb.mid[1]);
    globalCtx.stroke();

    // 记录面部池呈现时间
    p.out.t[blockIndex][trialIndex][1] = performance.now();

    const facePoolDuration = 5000; // 5秒
    await new Promise(resolve => {
        const checkInput = (event) => {
            document.removeEventListener('keydown', checkInput);
            resolve();
        };
        document.addEventListener('keydown', checkInput);
        setTimeout(() => {
            document.removeEventListener('keydown', checkInput);
            resolve();
        }, facePoolDuration);
    });

    // 3. IRI (反应间间隔) - 随机值 0.3 到 0.6 秒
    // 清空画布并设置背景色
    globalCtx.fillStyle = 'rgb(122, 122, 122)';
    globalCtx.fillRect(0, 0, p.w.width, p.w.height);
    // 记录 IRI 呈现时间
    p.out.t[blockIndex][trialIndex][2] = performance.now();
    const iriDuration = (Math.random() * (0.6 - 0.3) + 0.3) * 1000; // 0.3到0.6秒，转换为毫秒
    await new Promise(resolve => setTimeout(resolve, iriDuration));


    // 4. 评分 (VAS)
    // 记录评分阶段开始时间
    p.out.t[blockIndex][trialIndex][3] = performance.now();
    const vasResult = await getVASRating(globalCtx, p.vas, p.exp.vasInit[blockIndex][trialIndex]);

    let vasRating, rt_vas;
    if (typeof vasResult === 'number') {
        vasRating = vasResult;
        rt_vas = 0;
    } else {
        vasRating = vasResult.rating;
        rt_vas = vasResult.reactionTime;
    }

    // 5. ITI (试次间间隔) - 随机值 0.3 到 0.6 秒
    // 清空画布并设置背景色
    globalCtx.fillStyle = 'rgb(122, 122, 122)';
    globalCtx.fillRect(0, 0, p.w.width, p.w.height);
    // 记录 ITI 呈现时间
    p.out.t[blockIndex][trialIndex][4] = performance.now();
    const itiDuration = (Math.random() * (0.6 - 0.3) + 0.3) * 1000; // 0.3到0.6秒，转换为毫秒
    await new Promise(resolve => setTimeout(resolve, itiDuration));

    // 将当前试次的数据收集到 p.out.trials 对象中，以块名称为键
    const trialData = {
        subjectId: p.subject,
        blockIndex: blockIndex + 1, // 转换为 1 索引
        trialIndex: trialIndex + 1, // 转换为 1 索引
        blockName: currentBlockName, // 在试次数据中存储块名称
        facepoolnum: faceNum,
        proportion: proportion,
        target_num: target_num,
        nontarget_num: nontarget_num,
        objective_p: objective_p,
        vas_rating: vasRating,
        self_report_p: vasRating / 100,
        rt_vas: rt_vas,
        iri_duration: iriDuration, // 记录实际的IRI持续时间
        iti_duration: itiDuration,  // 记录实际的ITI持续时间
        // 添加详细时间戳
        timestamp_fixation_onset: p.out.t[blockIndex][trialIndex][0],
        timestamp_facepool_onset: p.out.t[blockIndex][trialIndex][1],
        timestamp_iri_onset: p.out.t[blockIndex][trialIndex][2],
        timestamp_rating_onset: p.out.t[blockIndex][trialIndex][3],
        timestamp_iti_onset: p.out.t[blockIndex][trialIndex][4]
    };
    // 如果此块名称的数组不存在，则初始化它
    if (!p.out.trials[currentBlockName]) {
        p.out.trials[currentBlockName] = [];
    }
    p.out.trials[currentBlockName].push(trialData);
}

/**
 * 模拟 MATLAB 的 RestAnnounce 函数。
 * 在 Canvas 上绘制休息提示文本。
 * @returns {Promise<void>}
 */
export async function RestAnnounce() {
    // 清空画布并设置背景色
    globalCtx.fillStyle = 'rgb(122, 122, 122)';
    globalCtx.fillRect(0, 0, p.w.width, p.w.height);

    globalCtx.fillStyle = 'black'; // 文本颜色
    globalCtx.font = 'bold 36px Arial'; // 字体大一点，加粗
    globalCtx.textAlign = 'center';
    globalCtx.textBaseline = 'middle';

    const centerX = p.w.width / 2;
    const centerY = p.w.height / 2;

    globalCtx.fillText('本小节结束，请休息一下', centerX, centerY);

    await new Promise(resolve => setTimeout(resolve, 2000)); // 模拟休息时间
}

/**
 * 在 Canvas 上显示实验结束界面。
 * @returns {Promise<void>}
 */
export async function ShowEndScreen() {
    // 清空画布并设置背景色
    globalCtx.fillStyle = 'rgb(122, 122, 122)';
    globalCtx.fillRect(0, 0, p.w.width, p.w.height);

    globalCtx.fillStyle = 'black'; // 文本颜色
    globalCtx.font = 'bold 48px Arial'; // 字体大一点，加粗
    globalCtx.textAlign = 'center';
    globalCtx.textBaseline = 'middle';

    const centerX = p.w.width / 2;
    const centerY = p.w.height / 2;

    globalCtx.fillText('实验结束，感谢您的参与！', centerX, centerY);

    // 可以选择在这里添加一个短暂的延时，然后自动隐藏 Canvas
    await new Promise(resolve => setTimeout(resolve, 3000)); // 显示3秒
}

/**
 * 将单个块的数据转换为 CSV 格式并发送到服务器保存。
 * @param {object} pObject - 包含所有实验配置和数据的 p 对象。
 * @param {string} blockName - 要保存的块名称。
 * @param {string} filename - 下载文件的名称。
 */
async function saveExperimentDataForBlock(pObject, blockName, filename) {
    try {
        console.log(`=== 保存 ${blockName} 块数据 ===`);
        
        // 只收集指定块的数据
        let blockTrials = [];
        if (pObject.out.trials[blockName]) {
            blockTrials = pObject.out.trials[blockName];
        }

        if (blockTrials.length === 0) {
            console.warn(`没有 ${blockName} 块的数据可供保存。`);
            return;
        }

        console.log(`${blockName} 块数据条数:`, blockTrials.length);

        // 获取所有列名（即所有试次对象的所有键），但过滤掉不需要的字段
        const allHeaders = Object.keys(blockTrials[0]);
        const excludedFields = [
            'iri_duration', 
            'iti_duration', 
            'timestamp_fixation_onset',
            'timestamp_facepool_onset', 
            'timestamp_iri_onset', 
            'timestamp_rating_onset', 
            'timestamp_iti_onset'
        ];
        const headers = allHeaders.filter(header => !excludedFields.includes(header));

        // 构建 CSV 头部
        let csvContent = headers.join(',') + '\n';

        // 构建 CSV 数据行
        blockTrials.forEach(row => {
            const values = headers.map(header => {
                let value = row[header];
                // 对包含逗号、引号或换行的值进行 CSV 转义
                if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                    value = `"${value.replace(/"/g, '""')}"`; // 双引号转义
                }
                return value;
            });
            csvContent += values.join(',') + '\n';
        });

        console.log('CSV内容长度:', csvContent.length);

        // 准备发送到服务器的数据
        const requestData = {
            filename: filename,
            csvContent: csvContent
        };

        console.log('准备发送CSV数据到服务器...');
        
        // 发送HTTP请求到服务器
        const response = await fetch('/save-experiment-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });

        console.log('服务器响应状态:', response.status);
        
        if (response.ok) {
            const result = await response.text();
            console.log('服务器响应:', result);
            console.log(`${blockName} 块数据保存成功`);
        } else {
            const errorText = await response.text();
            console.error('HTTP请求失败:', response.status, errorText);
            console.error(`${blockName} 块数据保存失败`);
        }
        
        console.log(`=== ${blockName} 块数据保存完成 ===`);
    } catch (error) {
        console.error(`保存 ${blockName} 块数据时发生错误:`, error);
        console.error('错误堆栈:', error.stack);
    }
}

/**
 * 获取全局的p对象，供其他模块使用
 * @returns {object} 全局的p对象
 */
export function getPObject() {
    return p;
}

/**
 * 将整个 p 结构体保存为 JSON 文件并发送到服务器。
 * 现在直接使用全局的p对象，不需要传入参数。
 * @param {number} subjectId - 被试ID。
 */
export async function savePStructureAsJson(subjectId) {
    try {
        console.log('=== savePStructureAsJson 开始执行 ===');
        console.log('subjectId:', subjectId);
        console.log('全局p对象:', p);
        console.log('p对象键:', Object.keys(p));
        
        // 检查p对象是否为空
        if (!p || Object.keys(p).length === 0) {
            console.error('p对象为空或未定义');
            alert('实验数据为空，无法保存JSON文件');
            return;
        }
        
        console.log('开始创建p对象的深拷贝...');
        // 创建一个深拷贝，以避免修改原始 p 对象，特别是对于循环引用问题
        const pCopy = JSON.parse(JSON.stringify(p));
        console.log('深拷贝创建成功，pCopy键:', Object.keys(pCopy));

        // 删除 pCopy.w，因为它是一个 DOM 对象，无法 JSON 序列化
        if (pCopy.w) {
            console.log('删除pCopy.w (DOM对象)');
            delete pCopy.w;
        }
        
        // 删除 pCopy.out.t，因为时间戳已经在试次数据中有单独字段
        if (pCopy.out && pCopy.out.t) {
            console.log('删除pCopy.out.t (时间戳数组)');
            delete pCopy.out.t;
        }
        
        // globalCtx 和 globalLoadedStimuli 已经是全局变量，不会在 p 结构体中，无需删除。

        console.log('开始序列化JSON...');
        const jsonContent = JSON.stringify(pCopy, null, 2); // 格式化 JSON 输出
        console.log('JSON内容长度:', jsonContent.length);
        console.log('JSON内容前100个字符:', jsonContent.substring(0, 100));

        const filename = `sub${String(subjectId).padStart(2, '0')}_p_data.json`;
        console.log('文件名:', filename);

        // 准备发送到服务器的数据
        const requestData = {
            filename: filename,
            jsonContent: jsonContent,
            subjectId: subjectId
        };

        console.log('准备发送数据到服务器...');
        
        // 发送HTTP请求到服务器
        const response = await fetch('/save-json-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });

        console.log('服务器响应状态:', response.status);
        
        if (response.ok) {
            const result = await response.json();
            console.log('服务器响应:', result);
            
            if (result.success) {
                console.log('JSON数据保存成功');
                alert(`实验数据已成功保存到服务器！\n文件路径: ${result.filePath}`);
            } else {
                console.error('服务器返回错误:', result.message);
                alert(`保存失败: ${result.message}`);
            }
        } else {
            const errorText = await response.text();
            console.error('HTTP请求失败:', response.status, errorText);
            alert(`保存失败: HTTP ${response.status} - ${errorText}`);
        }
        
        console.log('=== savePStructureAsJson 执行完成 ===');
    } catch (error) {
        console.error('保存JSON文件时发生错误:', error);
        console.error('错误堆栈:', error.stack);
        alert(`保存JSON文件时发生错误: ${error.message}`);
    }
}

/**
 * 运行 CH 实验流程。
 */
export async function runExperimentCH() {
    // 找到CH实验的块索引（前两个或后两个，取决于被试ID）
    const chBlockIndices = [];
    for (let i = 0; i < p.exp.condlabs.length; i++) {
        if (p.exp.condlabs[i].includes('CH')) {
            chBlockIndices.push(i);
        }
    }

    console.log('CH实验块索引:', chBlockIndices);
    console.log('CH实验条件:', chBlockIndices.map(i => p.exp.condlabs[i]));

    // 循环遍历CH实验的块
    for (let b = 0; b < chBlockIndices.length; b++) {
        const blockIndex = chBlockIndices[b];
        const blockName = p.exp.condlabs[blockIndex];
        
        await ShowBlockAnnounce(blockName);
        for (let t = 0; t < p.exp.ntrials; t++) {
            await RunTrial(t, blockIndex);
        }
        // 在每个块结束后保存 CSV 数据
        const filename = `sub${String(p.subject).padStart(2, '0')}_${blockName}.csv`;
        await saveExperimentDataForBlock(p, blockName, filename);

        //显示休息提示
        if (b < chBlockIndices.length - 1) {
            await RestAnnounce();
        }
    }
}

/**
 * 运行 AF 实验流程。
 */
export async function runExperimentAF() {
    // 找到AF实验的块索引（前两个或后两个，取决于被试ID）
    const afBlockIndices = [];
    for (let i = 0; i < p.exp.condlabs.length; i++) {
        if (p.exp.condlabs[i].includes('AF')) {
            afBlockIndices.push(i);
        }
    }

    console.log('AF实验块索引:', afBlockIndices);
    console.log('AF实验条件:', afBlockIndices.map(i => p.exp.condlabs[i]));

    // 循环遍历AF实验的块
    for (let b = 0; b < afBlockIndices.length; b++) {
        const blockIndex = afBlockIndices[b];
        const blockName = p.exp.condlabs[blockIndex];
        
        await ShowBlockAnnounce(blockName);
        for (let t = 0; t < p.exp.ntrials; t++) {
            await RunTrial(t, blockIndex);
        }
        // 在每个块结束后保存 CSV 数据
        const filename = `sub${String(p.subject).padStart(2, '0')}_${blockName}.csv`;
        await saveExperimentDataForBlock(p, blockName, filename);

        //显示休息提示
        if (b < afBlockIndices.length - 1) {
            await RestAnnounce();
        }
    }
}
