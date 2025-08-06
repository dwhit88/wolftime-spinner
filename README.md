# Name Spinner Wheel

A simple JavaScript web application that creates a spinning wheel to randomly select names from a list.

## Features

- **Spinning Animation**: The wheel spins for exactly 5 seconds with a realistic deceleration
- **Custom Names**: Add, remove, or clear names from the wheel
- **Visual Indicator**: A red marker at the top shows the selected name when the wheel stops
- **Responsive Design**: Works on both desktop and mobile devices
- **Modern UI**: Clean, gradient-based design with smooth animations

## How to Use

1. **Open the Application**: Simply open `index.html` in any modern web browser
2. **Add Names**: Use the input field to add names to the wheel
3. **Spin the Wheel**: Click the "SPIN" button to start the 5-second spinning animation
4. **View Results**: The selected name will be displayed below the wheel after it stops spinning

## File Structure

- `index.html` - Main HTML structure
- `styles.css` - CSS styling and animations
- `script.js` - JavaScript functionality for the spinning wheel
- `README.md` - This documentation file

## Technical Details

- **Animation Duration**: 5 seconds with cubic-bezier easing
- **Default Names**: Alice, Bob, Charlie, Diana, Eve, Frank
- **Color Scheme**: Rotating colors for each segment
- **Browser Compatibility**: Works in all modern browsers

## Local Usage

This application runs entirely in the browser and doesn't require any server setup. Just open the `index.html` file in your web browser to start using it.

## Customization

You can easily modify the application by:
- Changing the default names in the `script.js` file
- Adjusting the animation duration in the `spin()` method
- Modifying colors in the `styles.css` file
- Adding more features like saving/loading name lists