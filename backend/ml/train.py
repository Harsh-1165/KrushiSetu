import os
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout

# Configuration
# Pointing directly to your Downloads folder to save space/time
DATASET_DIR = r"C:/Users/HARSH/Downloads/archive (1)/PlantVillage"
MODEL_SAVE_PATH = "models/crop_disease_model.h5"
IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 10

def train_model():
    if not os.path.exists(DATASET_DIR):
        print(f"❌ Error: Dataset directory '{DATASET_DIR}' not found.")
        print("Please place your dataset in 'backend/ml/dataset/' with subfolders for each class.")
        return

    print("🚀 Starting Model Training...")

    # Data Augmentation & Loading
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        rotation_range=20,
        zoom_range=0.2,
        horizontal_flip=True,
        validation_split=0.2
    )

    train_generator = train_datagen.flow_from_directory(
        DATASET_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        subset='training'
    )

    validation_generator = train_datagen.flow_from_directory(
        DATASET_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        subset='validation'
    )

    # Build CNN Model
    model = Sequential([
        Conv2D(32, (3, 3), activation='relu', input_shape=(224, 224, 3)),
        MaxPooling2D(2, 2),
        Conv2D(64, (3, 3), activation='relu'),
        MaxPooling2D(2, 2),
        Conv2D(128, (3, 3), activation='relu'),
        MaxPooling2D(2, 2),
        Flatten(),
        Dense(512, activation='relu'),
        Dropout(0.5),
        Dense(train_generator.num_classes, activation='softmax')
    ])

    model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

    # Train
    history = model.fit(
        train_generator,
        steps_per_epoch=train_generator.samples // BATCH_SIZE,
        validation_data=validation_generator,
        validation_steps=validation_generator.samples // BATCH_SIZE,
        epochs=EPOCHS
    )

    # Save
    if not os.path.exists("models"):
        os.makedirs("models")

    model.save(MODEL_SAVE_PATH)
    print(f"✅ Model saved to {MODEL_SAVE_PATH}")

    # Save Class Indices mapping
    import json
    with open("models/class_indices.json", "w") as f:
        json.dump(train_generator.class_indices, f)
    print("✅ Class indices saved.")

if __name__ == "__main__":
    try:
        train_model()
    except Exception as e:
        print(f"❌ Training Failed: {e}")
