function intToRoman(num) {
    const values = {
        'M': 1000, 'CM': 900, 'D': 500, 'CD': 400,
        'C': 100, 'XC': 90, 'L': 50, 'XL': 40,
        'X': 10, 'IX': 9, 'V': 5, 'IV': 4,
        'I': 1
    };

    return Object.entries(values).reduce((acc, [symbol, value]) => {
        while (num >= value) {
            acc += symbol;
            num -= value;
        }
        return acc;
    }, '');
}


function romanToInt(roman) {
    const romanToValueMap = {
        'I': 1, 'V': 5,
        'X': 10, 'L': 50,
        'C': 100, 'D': 500,
        'M': 1000
    };

    return roman.split('').reduce((acc, curr, index, arr) => {
        const currValue = romanToValueMap[curr];
        const nextValue = romanToValueMap[arr[index + 1]] || 0;

        if (currValue < nextValue) {
            return acc - currValue;
        } else {
            return acc + currValue;
        }
    }, 0);
}

module.exports = {
    romanToInt,
    intToRoman
};
