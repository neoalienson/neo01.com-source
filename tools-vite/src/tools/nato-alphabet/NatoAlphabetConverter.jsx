const NATO_ALPHABET = {
  'A': 'Alpha', 'B': 'Bravo', 'C': 'Charlie', 'D': 'Delta',
  'E': 'Echo', 'F': 'Foxtrot', 'G': 'Golf', 'H': 'Hotel',
  'I': 'India', 'J': 'Juliet', 'K': 'Kilo', 'L': 'Lima',
  'M': 'Mike', 'N': 'November', 'O': 'Oscar', 'P': 'Papa',
  'Q': 'Quebec', 'R': 'Romeo', 'S': 'Sierra', 'T': 'Tango',
  'U': 'Uniform', 'V': 'Victor', 'W': 'Whiskey', 'X': 'X-ray',
  'Y': 'Yankee', 'Z': 'Zulu',
  '0': 'Zero', '1': 'One', '2': 'Two', '3': 'Three',
  '4': 'Four', '5': 'Five', '6': 'Six', '7': 'Seven',
  '8': 'Eight', '9': 'Nine'
};

export function toStandardNato(text) {
  return text.toUpperCase().split('').map(char => {
    if (NATO_ALPHABET[char]) {
      return `${char} - ${NATO_ALPHABET[char]}`;
    } else if (char === ' ') {
      return '[SPACE]';
    } else if (char.match(/[^A-Z0-9]/)) {
      return `${char} - [${char}]`;
    }
    return char;
  }).join('\n');
}

export function toUppercaseNato(text) {
  return text.toUpperCase().split('').map(char => {
    if (NATO_ALPHABET[char]) {
      return NATO_ALPHABET[char].toUpperCase();
    } else if (char === ' ') {
      return 'SPACE';
    } else if (char.match(/[^A-Z0-9]/)) {
      return char;
    }
    return char;
  }).join(' ');
}

export function toLowercaseNato(text) {
  return text.toUpperCase().split('').map(char => {
    if (NATO_ALPHABET[char]) {
      return NATO_ALPHABET[char].toLowerCase();
    } else if (char === ' ') {
      return 'space';
    } else if (char.match(/[^A-Z0-9]/)) {
      return char;
    }
    return char;
  }).join(' ');
}

export function toDashSeparated(text) {
  return text.toUpperCase().split('').map(char => {
    if (NATO_ALPHABET[char]) {
      return NATO_ALPHABET[char];
    } else if (char === ' ') {
      return 'Space';
    } else if (char.match(/[^A-Z0-9]/)) {
      return char;
    }
    return char;
  }).join(' - ');
}

export function toCommaSeparated(text) {
  return text.toUpperCase().split('').map(char => {
    if (NATO_ALPHABET[char]) {
      return NATO_ALPHABET[char];
    } else if (char === ' ') {
      return 'Space';
    } else if (char.match(/[^A-Z0-9]/)) {
      return char;
    }
    return char;
  }).join(', ');
}

export function toPhoneticOnly(text) {
  return text.toUpperCase().split('').filter(char => NATO_ALPHABET[char])
    .map(char => NATO_ALPHABET[char]).join(' ');
}