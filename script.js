// Состояние калькулятора
let display = document.getElementById('display')
let previousExpression = document.getElementById('previousExpression')
let currentInput = '0' // Текущее вводимое число
let currentExpression = '' // Полное выражение для вычисления
let shouldResetInput = false // Нужно ли сбросить ввод после оператора или результата
let errorState = false // Находится ли калькулятор в состоянии ошибки
let lastResult = null // Результат последнего вычисления

// Обновление дисплея
function updateDisplay() {
	display.textContent = currentInput
	previousExpression.textContent = currentExpression
	display.classList.toggle('error', errorState)
}

// Добавление цифры
function appendNumber(number) {
	if (errorState) return

	// Если есть предыдущий результат и нужно сбросить ввод - очищаем калькулятор
	if (lastResult !== null && shouldResetInput) {
		clearAll()
	}

	if (shouldResetInput) {
		// Начинаем новое число после оператора или результата
		currentInput = number
		shouldResetInput = false
	} else {
		// Продолжаем ввод числа, заменяя 0 или добавляя цифру
		currentInput = currentInput === '0' ? number : currentInput + number
	}

	lastResult = null
	updateDisplay()
}

function appendOperator(operator) {
	if (errorState) return

	// Если есть предыдущий результат И мы начали вводить новое число
	if (lastResult !== null && !shouldResetInput) {
		// Начинаем новое выражение с предыдущего результата
		currentExpression = lastResult + ' ' + operator + ' '
		currentInput = lastResult
		shouldResetInput = true
		lastResult = null
	}
	// Если есть предыдущий результат И нужно сбросить ввод
	else if (lastResult !== null && shouldResetInput) {
		// Используем предыдущий результат как начало нового выражения
		currentExpression = lastResult + ' ' + operator + ' '
		currentInput = lastResult
		lastResult = null
		shouldResetInput = true
	}
	// Если мы уже вводили оператор (shouldResetInput = true) - заменяем последний оператор
	else if (shouldResetInput) {
		// Находим позицию последнего оператора и заменяем его
		const lastOperatorIndex = currentExpression.lastIndexOf(' ')
		if (lastOperatorIndex !== -1) {
			currentExpression =
				currentExpression.substring(0, lastOperatorIndex - 1) +
				' ' +
				operator +
				' '
		}
	}
	// Обычный случай - добавляем текущее число и оператор к выражению
	else {
		currentExpression += currentInput + ' ' + operator + ' '
		shouldResetInput = true
	}

	updateDisplay()
}

// Добавление десятичной точки
function appendDecimal() {
	if (errorState) return

	// Если есть предыдущий результат - начинаем новое вычисление
	if (lastResult !== null && shouldResetInput) {
		clearAll()
	}

	if (shouldResetInput) {
		// Начинаем новое число с точкой
		currentInput = '0.'
		shouldResetInput = false
	} else if (!currentInput.includes('.')) {
		// Добавляем точку если её еще нет в числе
		currentInput += '.'
	}

	lastResult = null
	updateDisplay()
}

// Вычисление результата
function calculate() {
	if (errorState) return

	try {
		let fullExpression

		// Формируем полное выражение в зависимости от текущего состояния
		if (lastResult !== null && !shouldResetInput) {
			// Используем предыдущий результат + новое выражение
			fullExpression = lastResult + currentExpression + currentInput
		} else if (lastResult !== null) {
			// Используем только предыдущий результат
			fullExpression = lastResult.toString()
		} else if (!shouldResetInput) {
			// Используем текущее выражение и ввод
			fullExpression = currentExpression + currentInput
		} else {
			// Убираем последний оператор из выражения
			fullExpression = currentExpression.slice(0, -3)
		}

		// Проверка на пустое выражение
		if (!fullExpression.trim()) {
			throw new Error('Введите выражение')
		}

		let expressionToEval = fullExpression.replace(/×/g, '*')

		// Проверка на деление на ноль
		const divisionByZeroRegex = /\/\s*0(?!\.)/g
		if (divisionByZeroRegex.test(expressionToEval)) {
			throw new Error('Деление на ноль')
		}

		// Проверка на некорректные символы
		if (!/^[0-9+\-*/.() ]+$/.test(expressionToEval)) {
			throw new Error('Некорректные символы в выражении')
		}

		let result = eval(expressionToEval)

		// Проверка на бесконечность и NaN
		if (!isFinite(result)) {
			if (isNaN(result)) {
				throw new Error('Нечисловой результат (NaN)')
			} else {
				throw new Error('Бесконечный результат')
			}
		}

		// Округление и форматирование результата
		result = Math.round(result * 10000000000) / 10000000000
		result =
			result % 1 === 0
				? result.toString()
				: parseFloat(result.toFixed(10)).toString()

		// Сохраняем результат и обновляем состояние
		previousExpression.textContent = fullExpression + ' ='
		lastResult = result
		currentInput = result
		currentExpression = ''
		shouldResetInput = true
		errorState = false
	} catch (error) {
		handleError(error.message)
	}

	updateDisplay()
}

// Удаление последней цифры
function backspace() {
	if (errorState) return

	// Если текущий ввод пустой или равен '0', пытаемся удалить последний оператор из выражения
	if (currentInput === '0' || currentInput === '') {
		if (currentExpression.length > 0) {
			// Удаляем последний оператор (3 символа: пробел + оператор + пробел)
			currentExpression = currentExpression.slice(0, -3)
			shouldResetInput = false
			// Восстанавливаем предыдущее значение currentInput из выражения
			const tokens = currentExpression.split(' ')
			currentInput = tokens.length > 0 ? tokens[tokens.length - 1] : '0'
		}
	} else {
		// Обычное удаление символа из текущего ввода
		if (currentInput.length > 1) {
			currentInput = currentInput.slice(0, -1)
		} else {
			currentInput = '0'
		}
	}

	updateDisplay()
}

// Обработка ошибок
function handleError(message) {
	errorState = true
	currentInput = message
	currentExpression = 'Ошибка'
	lastResult = null

	setTimeout(clearAll, 3000)
}

// Очистка калькулятора
function clearAll() {
	currentInput = '0'
	currentExpression = ''
	shouldResetInput = false
	errorState = false
	lastResult = null
	updateDisplay()
}

// Обработка клавиатуры
document.addEventListener('keydown', function (event) {
	if (errorState && event.key !== 'Escape') return

	const key = event.key
	if (key >= '0' && key <= '9') appendNumber(key)
	else if (key === '.') appendDecimal()
	else if (key === '+') appendOperator('+')
	else if (key === '-') appendOperator('-')
	else if (key === '*') appendOperator('×')
	else if (key === '/') {
		event.preventDefault()
		appendOperator('/')
	} else if (key === 'Enter' || key === '=') {
		event.preventDefault()
		calculate()
	} else if (key === 'Escape') clearAll()
	else if (key === 'Backspace') {
		event.preventDefault()
		backspace()
	}
})

// Инициализация
updateDisplay()
