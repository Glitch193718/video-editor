// Nebula Editor - Frontend JavaScript
class NebulaEditor {
    constructor() {
        this.currentFile = null;
        this.currentSettings = {
            quality: 'lossless',
            format: '1x1',
            enhancements: []
        };
        this.init();
    }

    init() {
        this.bindEvents();
        this.showSection('uploadSection');
    }

    bindEvents() {
        // Загрузка файла
        document.getElementById('selectFileBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });

        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFileSelect(e);
        });

        // Drag and drop
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleFileSelect(e);
        });

        // Удаление файла
        document.getElementById('removeFileBtn').addEventListener('click', () => {
            this.removeFile();
        });

        // Настройки качества
        document.querySelectorAll('.quality-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectQuality(btn.dataset.quality);
            });
        });

        // Форматы
        document.querySelectorAll('.format-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectFormat(btn.dataset.format);
            });
        });

        // Улучшения
        document.querySelectorAll('.enhancement-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.toggleEnhancement(btn.dataset.enhancement);
            });
        });

        // Обработка
        document.getElementById('processBtn').addEventListener('click', () => {
            this.processVideo();
        });

        // Результат
        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.downloadResult();
        });

        document.getElementById('newProcessBtn').addEventListener('click', () => {
            this.startNewProcess();
        });
    }

    handleFileSelect(event) {
        const file = event.target.files?.[0] || event.dataTransfer?.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('video/')) {
            this.showError('Пожалуйста, выберите видео файл');
            return;
        }

        if (file.size > 500 * 1024 * 1024) { // 500MB limit
            this.showError('Файл слишком большой. Максимальный размер: 500MB');
            return;
        }

        this.currentFile = file;
        this.displayFileInfo(file);
        this.showSection('settingsSection');
    }

    displayFileInfo(file) {
        const fileName = document.getElementById('fileName');
        const fileSize = document.getElementById('fileSize');
        const videoPreview = document.getElementById('videoPreview');

        fileName.textContent = file.name;
        fileSize.textContent = this.formatFileSize(file.size);

        // Создаем превью видео
        const video = document.createElement('video');
        video.controls = true;
        video.src = URL.createObjectURL(file);
        video.style.maxWidth = '100%';
        
        videoPreview.innerHTML = '';
        videoPreview.appendChild(video);

        document.getElementById('fileInfo').style.display = 'block';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    removeFile() {
        this.currentFile = null;
        document.getElementById('fileInfo').style.display = 'none';
        document.getElementById('fileInput').value = '';
        this.showSection('uploadSection');
    }

    selectQuality(quality) {
        this.currentSettings.quality = quality;
        
        document.querySelectorAll('.quality-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelector(`[data-quality="${quality}"]`).classList.add('active');
    }

    selectFormat(format) {
        this.currentSettings.format = format;
        
        document.querySelectorAll('.format-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelector(`[data-format="${format}"]`).classList.add('active');
    }

    toggleEnhancement(enhancement) {
        const index = this.currentSettings.enhancements.indexOf(enhancement);
        const btn = document.querySelector(`[data-enhancement="${enhancement}"]`);
        
        if (index === -1) {
            this.currentSettings.enhancements.push(enhancement);
            btn.classList.add('active');
        } else {
            this.currentSettings.enhancements.splice(index, 1);
            btn.classList.remove('active');
        }
    }

    async processVideo() {
        if (!this.currentFile) {
            this.showError('Пожалуйста, выберите видео файл');
            return;
        }

        this.showSection('progressSection');
        
        const formData = new FormData();
        formData.append('video', this.currentFile);
        formData.append('settings', JSON.stringify(this.currentSettings));

        try {
            const response = await fetch('/process', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Ошибка обработки видео');
            }

            const result = await response.json();
            
            if (result.success) {
                this.displayResult(result);
            } else {
                throw new Error(result.error || 'Неизвестная ошибка');
            }
        } catch (error) {
            this.showError(`Ошибка обработки: ${error.message}`);
            this.showSection('settingsSection');
        }
    }

    displayResult(result) {
        const resultVideo = document.getElementById('resultVideo');
        const resultSize = document.getElementById('resultSize');
        const resultResolution = document.getElementById('resultResolution');
        const resultDuration = document.getElementById('resultDuration');
        const resultFormat = document.getElementById('resultFormat');

        // Создаем элемент видео для результата
        const video = document.createElement('video');
        video.controls = true;
        video.src = result.download_url;
        video.style.maxWidth = '100%';
        
        resultVideo.innerHTML = '';
        resultVideo.appendChild(video);

        // Заполняем информацию
        resultSize.textContent = this.formatFileSize(result.file_size);
        resultResolution.textContent = `${result.width}x${result.height}`;
        resultDuration.textContent = `${Math.round(result.duration)}s`;
        resultFormat.textContent = this.getFormatName(this.currentSettings.format);

        this.showSection('resultSection');
    }

    getFormatName(format) {
        const formats = {
            '1x1': '1:1 (1080×1080)',
            '9x16': '9:16 (1080×1920)',
            '16x9': '16:9 (1920×1080)',
            '4x5': '4:5 (1080×1350)',
            '1x2': '1:2 (1080×2160)',
            '2x1': '2:1 (2160×1080)',
            '21x9': '21:9 (2560×1080)'
        };
        return formats[format] || format;
    }

    downloadResult() {
        // В реальном приложении здесь будет ссылка на скачивание
        alert('Функция скачивания будет реализована в бэкенде');
    }

    startNewProcess() {
        this.currentFile = null;
        this.currentSettings.enhancements = [];
        this.showSection('uploadSection');
        
        // Сброс UI
        document.getElementById('fileInfo').style.display = 'none';
        document.getElementById('fileInput').value = '';
        
        document.querySelectorAll('.quality-btn, .format-btn, .enhancement-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Установка значений по умолчанию
        document.querySelector('[data-quality="lossless"]').classList.add('active');
        document.querySelector('[data-format="1x1"]').classList.add('active');
    }

    showSection(sectionId) {
        // Скрываем все секции
        document.querySelectorAll('section').forEach(section => {
            section.style.display = 'none';
        });
        
        // Показываем нужную секцию
        document.getElementById(sectionId).style.display = 'block';
    }

    showError(message) {
        // Создаем красивый toast для ошибок
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #ff6b6b, #ee5a52);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(255, 107, 107, 0.3);
            z-index: 1000;
            animation: slideInRight 0.3s ease-out;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 5000);
    }

    updateProgress(percent, status, details) {
        const progressFill = document.getElementById('progressFill');
        const progressPercent = document.getElementById('progressPercent');
        const progressStatus = document.getElementById('progressStatus');
        const progressDetails = document.getElementById('progressDetails');

        progressFill.style.width = `${percent}%`;
        progressPercent.textContent = `${percent}%`;
        progressStatus.textContent = status;
        progressDetails.textContent = details;
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new NebulaEditor();
    
    // Добавляем CSS для анимаций toast
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
});
