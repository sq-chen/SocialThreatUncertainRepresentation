// script/main.js

// 只导入非实验流程相关的模块
import { preloadStimuli } from './stimuliLoader.js';

/**
 * 启动应用程序的主函数。
 * 负责获取被试ID，预加载刺激，并根据ID的奇偶性启动不同的实验流程。
 */
async function startApp() {
    // 获取HTML元素
    const startScreen = document.getElementById('start-screen');
    const loadingSpinner = document.getElementById('loading-spinner');
    const experimentCanvas = document.getElementById('experimentCanvas');
    const endScreen = document.getElementById('end-screen');
    const subjectIdInput = document.getElementById('subject-id');
    const startButton = document.getElementById('start-button');

    // 监听开始按钮点击事件
    startButton.addEventListener('click', async () => {
        const subjectIdStr = subjectIdInput.value.trim();
        // 直接使用原始字符串作为被试ID，支持字母数字混合
        const subjectId = subjectIdStr;
        console.log('被试ID字符串:', subjectIdStr);
        console.log('被试ID变量:', subjectId);

        // --- 被试 ID 验证逻辑 ---
        
        // 1. 检查是否为空或只包含空格
        if (subjectIdStr === '') {
            // 提示：请输入一个有效的被试 ID
            alert('Please enter a valid Subject ID.');
            return;
        }

        // 2. 注释掉纯数字校验，允许字母与数字混合的ID
        // if (!/^\d+$/.test(subjectIdStr)) {
        //     // 提示：请输入数字
        //     alert('Please enter a number.');
        //     return;
        // }
        
        // 3. 注释掉数字有效性检查，因为现在允许非数字ID
        // if (isNaN(subjectId)) {
        //     // 提示：请输入一个有效的被试 ID (数字)
        //     alert('Please enter a valid Subject ID (number).'); 
        //     return;
        // }
        
        // 4. 生成随机数1或2来决定block顺序（替代原有的ID奇偶性判断）
        const randomOrderNumber = Math.random() < 0.5 ? 1 : 2;
        console.log('生成的随机顺序数:', randomOrderNumber);
        // --- 验证逻辑结束 ---
        
        // 隐藏开始界面，显示加载指示器
        startScreen.classList.add('hidden');
        loadingSpinner.classList.remove('hidden');

        // 定义所有需要预加载的面部刺激路径
        const allStimuliPaths = [
            // Happy_AF 刺激
            'stimuli/AF_H_F_01.png', 'stimuli/AF_H_F_02.png', 'stimuli/AF_H_F_03.png', 'stimuli/AF_H_F_04.png',
            'stimuli/AF_H_F_05.png', 'stimuli/AF_H_F_06.png', 'stimuli/AF_H_F_07.png', 'stimuli/AF_H_F_08.png',
            'stimuli/AF_H_M_01.png', 'stimuli/AF_H_M_02.png', 'stimuli/AF_H_M_03.png', 'stimuli/AF_H_M_04.png',
            'stimuli/AF_H_M_05.png', 'stimuli/AF_H_M_06.png', 'stimuli/AF_H_M_07.png', 'stimuli/AF_H_M_08.png',
            // Angry_AF 刺激
            'stimuli/AF_A_F_01.png', 'stimuli/AF_A_F_02.png', 'stimuli/AF_A_F_03.png', 'stimuli/AF_A_F_04.png',
            'stimuli/AF_A_F_05.png', 'stimuli/AF_A_F_06.png', 'stimuli/AF_A_F_07.png', 'stimuli/AF_A_F_08.png',
            'stimuli/AF_A_M_01.png', 'stimuli/AF_A_M_02.png', 'stimuli/AF_A_M_03.png', 'stimuli/AF_A_M_04.png',
            'stimuli/AF_A_M_05.png', 'stimuli/AF_A_M_06.png', 'stimuli/AF_A_M_07.png', 'stimuli/AF_A_M_08.png',
            // Happy_CH 刺激
            'stimuli/CH_H_F_01.png', 'stimuli/CH_H_F_02.png', 'stimuli/CH_H_F_03.png', 'stimuli/CH_H_F_04.png',
            'stimuli/CH_H_F_05.png', 'stimuli/CH_H_F_06.png', 'stimuli/CH_H_F_07.png', 'stimuli/CH_H_F_08.png',
            'stimuli/CH_H_M_01.png', 'stimuli/CH_H_M_02.png', 'stimuli/CH_H_M_03.png', 'stimuli/CH_H_M_04.png',
            'stimuli/CH_H_M_05.png', 'stimuli/CH_H_M_06.png', 'stimuli/CH_H_M_07.png', 'stimuli/CH_H_M_08.png',
            // Angry_CH 刺激
            'stimuli/CH_A_F_01.png', 'stimuli/CH_A_F_02.png', 'stimuli/CH_A_F_03.png', 'stimuli/CH_A_F_04.png',
            'stimuli/CH_A_F_05.png', 'stimuli/CH_A_F_06.png', 'stimuli/CH_A_F_07.png', 'stimuli/CH_A_F_08.png',
            'stimuli/CH_A_M_01.png', 'stimuli/CH_A_M_02.png', 'stimuli/CH_A_M_03.png', 'stimuli/CH_A_M_04.png',
            'stimuli/CH_A_M_05.png', 'stimuli/CH_A_M_06.png', 'stimuli/CH_A_M_07.png', 'stimuli/CH_A_M_08.png'
        ];

        try {
            // 预加载所有刺激图片
            const loadedStimuli = await preloadStimuli(allStimuliPaths);
            console.log('所有刺激已成功加载。', loadedStimuli);

            // 动态导入对应语言的 experiment.xx.js
            const lang = new URLSearchParams(window.location.search).get('lang') || 'zh';
            const experimentModulePath = `./experiment.${lang}.js`;
            console.log('加载实验模块:', experimentModulePath);
            const experimentModule = await import(experimentModulePath);

            // 隐藏开始界面，显示实验画布
            startScreen.classList.add('hidden');
            loadingSpinner.classList.add('hidden'); // 隐藏加载指示器
            experimentCanvas.classList.remove('hidden'); // 显示画布

            // 初始化实验状态 (p 对象)，传入随机顺序数
            experimentModule.initializeExperiment(subjectId, loadedStimuli, randomOrderNumber);

            // 在整个实验流程开始前，只显示一次指导语
            await experimentModule.ShowInstructions();

            // 仅一次呈现：练习指导 + 练习试次 + 练习后指导 + 正式前指导
            console.log('检查 runPracticeSequence 函数:', typeof experimentModule.runPracticeSequence);
            if (typeof experimentModule.runPracticeSequence === 'function') {
                console.log('开始运行练习序列...');
                await experimentModule.runPracticeSequence();
                console.log('练习序列完成');
            } else {
                // 向后兼容：若未提供统一函数，则回退为不做练习
                console.warn('runPracticeSequence 未定义，跳过练习阶段');
            }

            // 运行完整的实验流程（4个块），使用随机顺序数决定顺序
            if (randomOrderNumber % 2 === 0) {
                // 随机数为偶数：先运行 AF 实验，再运行 CH 实验
                console.log('随机数为偶数：先AF后CH');
                await experimentModule.runExperimentAF(); 
                await experimentModule.RestAnnounce();
                await experimentModule.runExperimentCH();
            } else {
                // 随机数为奇数：先运行 CH 实验，再运行 AF 实验
                console.log('随机数为奇数：先CH后AF');
                await experimentModule.runExperimentCH();
                await experimentModule.RestAnnounce();
                await experimentModule.runExperimentAF();
            }

            // 实验流程结束后，先不要隐藏画布，待数据成功保存后再显示结束提示

            console.log('=== 实验结束流程开始 ===');
            console.log('画布已隐藏，结束界面已显示');
            console.log('准备保存JSON文件...');
            console.log('当前subjectId:', subjectId);
            
            // 检查p对象是否可访问
            try {
                const pObject = experimentModule.getPObject();
                console.log('通过getPObject获取的p对象:', pObject);
                console.log('p对象键:', Object.keys(pObject));
            } catch (error) {
                console.error('无法获取p对象:', error);
            }
            
            const saveOk = await experimentModule.savePStructureAsJson(subjectId);
            console.log('JSON文件保存函数已调用，结果:', saveOk);

            if (saveOk) {
                console.log('准备显示实验结束界面...');
                await experimentModule.ShowEndScreen();
            } else {
                console.warn('数据未成功保存，跳过结束提示显示。');
            }
            console.log('实验结束界面流程完成');
            console.log('=== 实验结束流程完成 ===');

        } catch (error) {
            console.error('实验加载或运行过程中发生错误:', error);
            console.error('详细错误对象:', error); // 增强错误日志
            // 提示：实验发生错误
            alert('An experiment error occurred. Please check the console or contact the experimenter.');
            loadingSpinner.classList.add('hidden'); // 隐藏加载动画
            startScreen.classList.remove('hidden'); // 返回到开始界面
        }
    });
}

// 页面加载完成后启动应用程序
document.addEventListener('DOMContentLoaded', startApp);