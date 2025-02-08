from transformers import AutoTokenizer, AutoModel
import torch
import sys
import json



device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}", file=sys.stderr)
# Charger le tokenizer et le modèle pré-entraîné
tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased")
model = AutoModel.from_pretrained("distilbert-base-uncased").to(device)

def generate_embeddings(text):
    # Tokenizer le texte
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True)
    
    # Générer les embeddings
    with torch.no_grad():
        outputs = model(**inputs)
    
    # Prendre la moyenne des embeddings des tokens pour obtenir une représentation fixe
    embeddings = outputs.last_hidden_state.mean(dim=1).squeeze().tolist()
    
    return embeddings

if __name__ == "__main__":
    text = sys.argv[1]
    embeddings = generate_embeddings(text)
    print(json.dumps(embeddings))