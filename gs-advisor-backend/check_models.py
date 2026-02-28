# gs-advisor-backend/check_models.py
import os
import google.generativeai as genai  # <-- This is the correct import for LangChain
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    print("❌ No GOOGLE_API_KEY found in .env")
    exit()

try:
    genai.configure(api_key=api_key)
    
    print("\n🔍 Contacting Google to list available CHAT models...")
    
    found_chat_model = False
    print("\n✅ AVAILABLE CHAT MODELS (use one of these in rag.py):")
    for model in genai.list_models():
        # Find models that support 'generateContent' for chatting
        if 'generateContent' in model.supported_generation_methods:
            print(f"   • {model.name}")
            found_chat_model = True
            
    if not found_chat_model:
        print("❌ No chat models found. Please check your Google Cloud project permissions.")

except Exception as e:
    print(f"❌ An error occurred: {e}")