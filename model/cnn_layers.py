import os
import numpy as np
import random
from PIL import Image, ImageEnhance
import matplotlib.pyplot as plt
from sklearn.metrics import confusion_matrix
import seaborn as sns

class ConvolutionalLayer:
    def __init__(self, input_shape, filter_size, number_of_filters, stride=1, padding=1):
        self.input_channels, self.input_height, self.input_width = input_shape
        self.filter_size = filter_size
        self.number_of_filters = number_of_filters
        self.stride = stride
        self.padding = padding

        # Output height and width (convolution)
        self.output_height = (self.input_height + 2*padding - filter_size)//stride + 1
        self.output_width = (self.input_width + 2*padding - filter_size)//stride + 1
        self.output_shape = (number_of_filters, self.output_height, self.output_width)
        # // operator ensures whole numbers

        # Initialize filters and biases
        self.filters = np.random.randn(number_of_filters, self.input_channels, filter_size, filter_size) * np.sqrt(2. / self.input_channels)# learnable weights for feature extraction
        self.biases = np.zeros((number_of_filters, ))  # one bias per filter, INITIALIZED zero

    def forward(self, input_data):
        self.input_data = input_data 
        batch_size, _, _, _ = input_data.shape # unpacking by ignoring all except batch_size

        # Output tensor
        conv_output = np.zeros((batch_size, self.number_of_filters, self.output_height, self.output_width))

        # Apply padding if needed
        if self.padding > 0:
            self.input_padded = np.pad(input_data, 
                                  ((0,0), (0,0), (self.padding,self.padding), 
                                   (self.padding,self.padding)), mode='constant')
        else:
            self.input_padded = input_data

        # Perform convolution
        for n in range(batch_size): # loop over each image in the batch
            for filter_index in range(self.number_of_filters): # loop over each filter
                # i,j - loop over every position the filter slides to (top-left corner of the patch)
                for i in range(self.output_height):
                    for j in range(self.output_width):
                        vert_start = i * self.stride
                        vert_end = vert_start + self.filter_size
                        horiz_start = j * self.stride
                        horiz_end = horiz_start + self.filter_size

                        current_patch = self.input_padded[n, :, vert_start:vert_end, horiz_start:horiz_end]
                        conv_output[n, filter_index, i, j] = np.sum(current_patch * self.filters[filter_index]) + float(self.biases[filter_index])
        return conv_output
    
    def backward(self, d_out):
        """
        d_out: gradient w.r.t output of conv layer
        returns: gradient w.r.t input
        """
        batch_size, _, _, _ = d_out.shape
        d_input_padded = np.zeros_like(self.input_padded)
        self.dfilters = np.zeros_like(self.filters)
        self.dbiases = np.zeros_like(self.biases)
        
        for n in range(batch_size):
            for f in range(self.number_of_filters):
                for i in range(self.output_height):
                    for j in range(self.output_width):
                        vert_start = i * self.stride
                        vert_end = vert_start + self.filter_size
                        horiz_start = j * self.stride
                        horiz_end = horiz_start + self.filter_size
                        patch = self.input_padded[n, :, vert_start:vert_end, horiz_start:horiz_end]
                        
                        # Gradients
                        self.dfilters[f] += d_out[n,f,i,j] * patch
                        self.dbiases[f] += d_out[n,f,i,j]
                        d_input_padded[n, :, vert_start:vert_end, horiz_start:horiz_end] += d_out[n,f,i,j] * self.filters[f]
        
        # Remove padding
        if self.padding > 0:
            d_input = d_input_padded[:, :, self.padding:-self.padding, self.padding:-self.padding]
        else:
            d_input = d_input_padded
        return d_input


class ReLULayer:
    def forward(self, input_data):
        self.input=input_data
        return np.maximum(0, input_data)
    
    def backward(self, d_out):
        return d_out * (self.input > 0)
    
class MaxPoolingLayer:
    def __init__(self, pool_size=2, stride=2):
        self.pool_size = pool_size
        self.stride = stride

    def forward(self, input_data):
        self.input = input_data
        self.max_indices = np.zeros_like(input_data, dtype=bool)  # same shape as input
        batch_size, channels, input_height, input_width = input_data.shape
        output_height = (input_height - self.pool_size)//self.stride + 1
        output_width = (input_width - self.pool_size)//self.stride + 1

        pooled_output = np.zeros((batch_size, channels, output_height, output_width))

        for n in range(batch_size):
            for c in range(channels):
                for i in range(output_height):
                    for j in range(output_width):
                        vert_start = i * self.stride
                        vert_end = vert_start + self.pool_size
                        horiz_start = j * self.stride
                        horiz_end = horiz_start + self.pool_size

                        current_patch = input_data[n, c, vert_start:vert_end, horiz_start:horiz_end]
                        max_val = np.max(current_patch)
                        pooled_output[n, c, i, j] = max_val
                        self.max_indices[n, c, vert_start:vert_end, horiz_start:horiz_end] = (current_patch == max_val)
        return pooled_output
    
    def backward(self, d_out):
        d_input = np.zeros_like(self.input)
        batch, ch, h, w = self.input.shape
        out_h = d_out.shape[2]
        out_w = d_out.shape[3]

        for n in range(batch):
            for c in range(ch):
                for i in range(out_h):
                    for j in range(out_w):
                        vert = i * self.stride
                        horiz = j * self.stride
                        mask = self.max_indices[n, c, vert:vert+self.pool_size, horiz:horiz+self.pool_size]
                        d_input[n, c, vert:vert+self.pool_size, horiz:horiz+self.pool_size] += d_out[n, c, i, j] * mask
        return d_input
    
class DenseLayer:
    def __init__(self, input_size, output_size):
        self.weights = np.random.randn(input_size, output_size) * 0.01
        self.biases = np.zeros((1, output_size))

    def forward(self, x):
        self.input = x  # store input for backward
        return np.dot(x, self.weights) + self.biases

    def backward(self, d_out):
        # Compute gradients
        self.dweights = np.dot(self.input.T, d_out)   
        self.dbiases = np.sum(d_out, axis=0, keepdims=True)  
        # Return gradient w.r.t input for previous layer
        return np.dot(d_out, self.weights.T)


def softmax_cross_entropy_loss(logits, labels):
    # logits: (batch_size, num_classes), labels: (batch_size,)
    labels = labels.astype(int)
    logits_stable = logits - np.max(logits, axis=1, keepdims=True)
    exp_scores = np.exp(logits_stable)
    probs = exp_scores / np.sum(exp_scores, axis=1, keepdims=True)
    
    batch_size = logits.shape[0]
    epsilon = 1e-9
    correct_logprobs = -np.log(probs[np.arange(batch_size), labels] + epsilon)
    loss = np.sum(correct_logprobs) / batch_size
    
    # Gradient w.r.t logits
    grad = probs.copy()
    grad[np.arange(batch_size), labels] -= 1
    grad /= batch_size
    return loss, grad


def load_data(data_dir, image_size=(48,48)):
    X, y = [], []
    label_map = {label: i for i, label in enumerate(os.listdir(data_dir))}
    
    for label in label_map:
        folder = os.path.join(data_dir, label)
        for img_file in os.listdir(folder):
            img_path = os.path.join(folder, img_file)
            img = Image.open(img_path).convert('L').resize(image_size)
            img_array = np.array(img, dtype=np.float32)/255.0
            X.append(img_array)
            y.append(label_map[label])
    
    X = np.array(X)[:, np.newaxis, :, :]  # shape (N, 1, 48, 48)
    y = np.array(y)  # shape (N,)
    return X, y

train_X, train_y = load_data("C:/Users/HP/OneDrive/Desktop/projectWorks/6MoodImage/moodcnnProgram/model/train")
test_X, test_y = load_data("C:/Users/HP/OneDrive/Desktop/projectWorks/6MoodImage/moodcnnProgram/model/test")


def augment_image(img):
    """Apply simple random augmentations to a single (1, 48, 48) image."""
    img = img.squeeze()  # remove channel dim → (48,48)
    img = Image.fromarray((img * 255).astype(np.uint8))  # convert to PIL Image

    # Random horizontal flip
    if random.random() < 0.5:
        img = img.transpose(Image.FLIP_LEFT_RIGHT)

    # Random small rotation (-15° to +15°)
    if random.random() < 0.5:
        angle = random.uniform(-15, 15)
        img = img.rotate(angle)

    # Random brightness change (0.8x–1.2x)
    if random.random() < 0.5:
        enhancer = ImageEnhance.Brightness(img)
        img = enhancer.enhance(random.uniform(0.8, 1.2))

    # Convert back to numpy + normalize
    img_array = np.array(img, dtype=np.float32) / 255.0

    return img_array[np.newaxis, :, :]  # back to (1,48,48)


def augment_batch(X_batch, y_batch):
    """Apply augmentation to each image in a batch."""
    X_aug = []
    for i in range(len(X_batch)):
        if random.random() < 0.7:  # 70% chance to augment
            X_aug.append(augment_image(X_batch[i]))
        else:
            X_aug.append(X_batch[i])  # keep original
    return np.array(X_aug), y_batch

