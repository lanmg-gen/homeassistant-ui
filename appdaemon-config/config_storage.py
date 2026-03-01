"""
Panel Backend - Configuration Storage Module
通用配置存储模块
"""

import appdaemon.plugins.hass.hassapi as hass
import json
from datetime import datetime


class ConfigStorage(hass.Hass):
    """配置存储类"""

    def initialize(self):
        """初始化"""
        self.log("=" * 50)
        self.log("Config Storage Module Init")
        self.log("=" * 50)

        # Data file path - 使用 AppDaemon 的配置目录
        config_dir = self.config.get('config_dir', '/config/appdaemon')
        self.data_file = f'{config_dir}/panel_config.json'
        self.log(f"Data file path: {self.data_file}")
        
        # Load data
        self.config_data = self._load_data()

        # Register services
        self.log("Registering services...")
        self.register_service("panel/save_config", self.handle_save_config)
        self.log("Service registered: panel/save_config")
        self.register_service("panel/load_config", self.handle_load_config)
        self.log("Service registered: panel/load_config")
        self.register_service("panel/get_all_configs", self.handle_get_all_configs)
        self.log("Service registered: panel/get_all_configs")
        self.register_service("panel/delete_config", self.handle_delete_config)
        self.log("Service registered: panel/delete_config")

        self.log(f"Loaded {len(self.config_data)} config items")
        self.log("=" * 50)
        self.log("Config Storage Module Ready")
        self.log("=" * 50)
    
    def _load_data(self):
        """加载数据"""
        try:
            with open(self.data_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                self.log(f"Data loaded from {self.data_file}")
                return data
        except FileNotFoundError:
            self.log(f"File not found: {self.data_file}, creating empty data")
            return {}
        except Exception as e:
            self.log(f"Error loading data: {e}")
            return {}
    
    def _save_data(self):
        """保存数据"""
        try:
            self.log(f"Attempting to save data to {self.data_file}")
            self.log(f"Data to save: {self.config_data}")
            with open(self.data_file, 'w', encoding='utf-8') as f:
                json.dump(self.config_data, f, ensure_ascii=False, indent=2)
            self.log(f"Data saved successfully to {self.data_file}")
        except Exception as e:
            self.log(f"Error saving data: {e}")
            import traceback
            self.log(f"Traceback: {traceback.format_exc()}")
    
    def handle_save_config(self, namespace, domain, service, data):
        """保存配置"""
        self.log(f"Service data: {data}")
        key = data.get('key')
        value = data.get('value')

        self.log(f"Key: {key}, Value: {value}")

        if not key:
            self.log("Error: key is required")
            return {"success": False, "error": "key is required"}

        # Save config
        self.config_data[key] = {
            "value": value,
            "updated_at": str(datetime.now())
        }
        self._save_data()

        self.log(f"Config saved: key={key}, value={value}")
        return {"success": True, "key": key}

    def handle_load_config(self, namespace, domain, service, data):
        """加载配置"""
        key = data.get('key')

        if not key:
            self.log("Error: key is required")
            return {"success": False, "error": "key is required"}

        config = self.config_data.get(key)
        if config:
            self.log(f"Config loaded: key={key}")
            return {"success": True, "key": key, "value": config["value"]}
        else:
            self.log(f"Config not found: key={key}")
            return {"success": False, "error": "Config not found"}

    def handle_get_all_configs(self, namespace, domain, service, data):
        """获取所有配置"""
        self.log(f"Get all configs: {len(self.config_data)} items")
        return {"success": True, "configs": self.config_data}

    def handle_delete_config(self, namespace, domain, service, data):
        """删除配置"""
        key = data.get('key')

        if not key:
            self.log("Error: key is required")
            return {"success": False, "error": "key is required"}

        if key in self.config_data:
            del self.config_data[key]
            self._save_data()
            self.log(f"Config deleted: key={key}")
            return {"success": True, "key": key}
        else:
            self.log(f"Config not found: key={key}")
            return {"success": False, "error": "Config not found"}
