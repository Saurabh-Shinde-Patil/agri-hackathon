from pymongo import MongoClient
import os
from .config import settings
from typing import List, Dict, Any

class HistoryService:
    def __init__(self):
        self.client = None
        self.db = None
        self.collection = None
        self._connect()

    def _connect(self):
        """Establish a connection to MongoDB Atlas."""
        if not settings.mongodb_uri:
            print("⚠️ [HISTORY] MONGODB_URI not configured. Historical accuracy disabled.")
            return

        try:
            self.client = MongoClient(settings.mongodb_uri)
            self.db = self.client[settings.database_name]
            # Use the collection name from the backend model (IotData -> iotdatas in Mongo usually)
            self.collection = self.db['iotdatas']
            print(f"✅ [HISTORY] Connected to MongoDB: {settings.database_name}")
        except Exception as e:
            print(f"❌ [HISTORY] MongoDB Connection Failed: {e}")

    def fetch_latest_history(self, farm_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Fetch the most recent N records for a given farm.
        Handles data gaps by fetching by count rather than just by date.
        """
        if self.collection is None:
            return []

        try:
            # Filter by farm_id and sort by timestamp descending
            query = {"farm_id": farm_id} if farm_id else {}
            cursor = self.collection.find(query).sort("timestamp", -1).limit(limit)
            
            history = list(cursor)
            if history:
                print(f"📈 [HISTORY] Successfully fetched {len(history)} records for Farm: {farm_id or 'Global'}")
            else:
                print(f"🔍 [HISTORY] No historical records found for Farm: {farm_id}")
            
            return history
        except Exception as e:
            print(f"❌ [HISTORY] Failed to fetch history: {e}")
            return []

# Global instance for easy access
history_service = HistoryService()
