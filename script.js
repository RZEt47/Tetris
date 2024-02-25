// Константы настройки canvas
const CANVAS_WIDTH = 375
const CANVAS_HEIGHT = 750
const CANVAS_BACKGROUND = '#ffffff'

// Константы настройки игрового поля
const ROW_NUMBERS = 20
const COLUMNS_NUMBERS = 10
const PADDING = 2

// Настройка блоков
const START_BLOCK_NUMBERS = [1, 3, 6, 7, 10, 13, 19]
const COLORS = ['black', 'blue', 'green', 'yellow', 'red', 'pink', 'gray']

// Размеры ячейки
const fieldWidth = CANVAS_WIDTH / COLUMNS_NUMBERS
const fieldHeight = CANVAS_HEIGHT / ROW_NUMBERS

const game1 = getGame(document.querySelector('#canvas1'))
const game2 = getGame(document.querySelector('#canvas2'))

game1.start()
game2.start()

// Настройка управления первого игрока
listen('KeyA', game1.moveBlockLeft)
listen('KeyD', game1.moveBlockRight)
listen('KeyS', game1.moveBlockDown)
listen('KeyW', game1.rotateBlock)

// Настройка управления второго игрока
listen('ArrowLeft', game2.moveBlockLeft)
listen('ArrowRight', game2.moveBlockRight)
listen('ArrowDown', game2.moveBlockDown)
listen('ArrowUp', game2.rotateBlock)

// Настройка обнавления status первого игрока
game1.updateStatus = function updateStatus (scope, level, tetris) {
	const element = document.querySelector('#status1')

	element.querySelector('[data-role="scope"]').textContent = scope
	element.querySelector('[data-role="level"]').textContent = level
	element.querySelector('[data-role="tetris"]').textContent = tetris
}

// Настройка обнавления status второго игрока
game2.updateStatus = function updateStatus (scope, level, tetris) {
	const element = document.querySelector('#status2')

	element.querySelector('[data-role="scope"]').textContent = scope
	element.querySelector('[data-role="level"]').textContent = level
	element.querySelector('[data-role="tetris"]').textContent = tetris
}

// Функция, позволяющая реагировать на нажатие конкретной клавиши.
function listen (code, handler) {
	document.body.addEventListener('keydown', function (event) {
		if (event.code === code) {
			event.preventDefault()
			handler()
		}
	})
}

function getGame (canvas) {
	// dom-элемент канвы и контекст отрисовки
	const context = canvas.getContext('2d')

	// Матрица ячеек игрового поля
	const map = getMap()

	// Текущий блок и время до падения блока на 1-у ячеку вниз
	let block = getBlock(
		getRandomFrom(START_BLOCK_NUMBERS),
		getRandomFrom(COLORS)
	)

	let scope = 0
	let level = 1
	let tetris = 0

	let downTime = getDownTime()

	// Настройка реального размера canvas
	canvas.width = CANVAS_WIDTH
	canvas.height = CANVAS_HEIGHT

	const game = {
		start,
		moveBlockDown,
		moveBlockLeft,
		moveBlockRight,
		rotateBlock,
		statusUpdate
	}

	return game

	// Заглушка функции обновления статуса игрока
	function statusUpdate () {}

	// Функция запуска игры
	function start () {
		requestAnimationFrame(tick)
	}

	// Переодически выполняющаяся функция с основной логикой отрисовки и начисления очков
	function tick (timestamp) {

		// Проверка на downTime момент
		if (timestamp >= downTime) {
			const blockCopy = block.getCopy()
			blockCopy.y = blockCopy.y + 1

			if (canBlockExists(blockCopy)) {
				block = blockCopy
			}

			else {
				saveBlock()
				const lines = clearLines()

				if (lines === 4) {
					tetris++
				}

				scope = scope + lines * 100
				level = 1 + parseInt(scope / 300)

				block = getBlock(
					getRandomFrom(START_BLOCK_NUMBERS),
					getRandomFrom(COLORS)
				)

				game.updateStatus(scope, level, tetris)

				if (!canBlockExists(block)) {
					alert('Конец игры!')
					return
				}
			}

			downTime = timestamp + getDownTime()
		}

		// Логика очистки и отрисовки
		clearCanvas()
		drawBlock()
		drawState()

		// Регистрация следующего запуска tick функции
		requestAnimationFrame(tick)
	}

	// Функция, возвращающуя в миллисекундах время на принятие решения по перемещению блока
	function getDownTime () {
		return 100 + 900 / level
	}

	function getRandomFrom (array) {
		const index = Math.floor(Math.random() * array.length)
		return array[index]
	}

	// Очистка canvas
	function clearCanvas () {
		context.fillStyle = CANVAS_BACKGROUND
		context.strokeStyle = 'black'

		context.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
		context.fill()
		context.stroke()
	}

	// Зарисовка ячеки на canvas
	function drawField (x, y, color) {
		context.fillStyle = color
		context.fillRect(
			x * fieldWidth + PADDING,
			y * fieldHeight + PADDING,
			fieldWidth - 2 * PADDING,
			fieldHeight - 2 * PADDING
		)
	}

	// Зарисовка блока в его текущем положении
	function drawBlock () {
		for (const part of block.getIncludedParts()) {
			drawField(part.x, part.y, block.color)
		}
	}

	// Проверка на законченные линии и их очистка с последующем опусканием всего остального
	function clearLines () {
		let lines = 0

		for (let y = ROW_NUMBERS - 1; y >= 0; y--) {
			let flag = true

			for (let x = 0; x < COLUMNS_NUMBERS; x++) {
				if (!getField(x, y)) {
					flag = false
					break
				}
			}

			if (flag) {
				lines = lines + 1

				for (let t = y; t >= 1; t--) {
					for (let x = 0; x < COLUMNS_NUMBERS; x++) {
						map[t][x] = map[t - 1][x]
						map[t - 1][x] = null
					}
				}

				y = y + 1
			}
		}

		return lines
	}

	// Генерация матрицы игрового поля
	function getMap () {
		const map = []

		for (let y = 0; y < ROW_NUMBERS; y++) {
			const row = []

			for (let x = 0; x < COLUMNS_NUMBERS; x++) {
				row.push(null)
			}

			map.push(row)
		}

		return map
	}

	// Сохранение элементов блока в матрицу игры
	function saveBlock () {
		for (const part of block.getIncludedParts()) {
			setField(part.x, part.y, block.color)
		}
	}

	// Отрисовка состоятния матрицы игры
	function drawState () {
		for (let y = 0; y < ROW_NUMBERS; y++) {
			for (let x = 0; x < COLUMNS_NUMBERS; x++) {
				const field = map[y][x]

				if (field) {
					drawField(x, y, field)
				}
			}
		}
	}

	// Генерация блока по его стартовым параметрам
	function getBlock (type, color = 'black', x = 4, y = 0) {
		const block = { type, x, y, color }

		// Возвращает массив объектов с координатами частей блока
		block.getIncludedParts = function () {
			const p = (dx, dy) => ({ x: block.x + dx, y: block.y + dy })

			switch (block.type) {
				case 1: return [p(0, 0), p(1, 0), p(0, 1), p(1, 1)]
				case 2: return [p(0, 0), p(-1, 0), p(1, 0), p(0, -1)]
				case 3: return [p(0, 0), p(-1, 0), p(1, 0), p(0, 1)]
				case 4: return [p(0, 0), p(0, 1), p(0, -1), p(1, 0)]
				case 5: return [p(0, 0), p(-1, 0), p(0, 1), p(0, -1)]
				case 6: return [p(0, 0), p(1, 0), p(0, 1), p(-1, 1)]
				case 7: return [p(0, 0), p(0, 1), p(1, 1), p(-1, 0)]
				case 8: return [p(0, 0), p(-1, 0), p(-1, -1), p(0, 1)]
				case 9: return [p(0, 0), p(0, -1), p(-1, 0), p(-1, 1)]
				case 10: return [p(0, 0), p(1, 0), p(2, 0), p(-1, 0)]
				case 11: return [p(0, 0), p(0, -1), p(0, 1), p(0, 2)]
				case 12: return [p(0, 0), p(1, 0), p(0, 1), p(0, 2)]
				case 13: return [p(0, 0), p(-1, 0), p(-2, 0), p(0, 1)]
				case 14: return [p(0, 0), p(-1, 0), p(0, -1), p(0, -2)]
				case 15: return [p(0, 0), p(0, -1), p(1, 0), p(2, 0)]
				case 16: return [p(0, 0), p(-1, 0), p(0, 1), p(0, 2)]
				case 17: return [p(0, 0), p(-1, 0), p(-2, 0), p(0, -1)]
				case 18: return [p(0, 0), p(1, 0), p(0, -1), p(0, -2)]
				case 19: return [p(0, 0), p(1, 0), p(2, 0), p(0, 1)]
			}
		}

		// Возвращает следующий блок перерождения
		block.getNextBlock = function () {
			const p = n => getBlock(n, block.color, block.x, block.y)

			switch (block.type) {
				case 1: return p(1)
				case 2: return p(4)
				case 3: return p(5)
				case 4: return p(3)
				case 5: return p(2)
				case 6: return p(8)
				case 7: return p(9)
				case 8: return p(6)
				case 9: return p(7)
				case 10: return p(11)
				case 11: return p(10)
				case 12: return p(13)
				case 13: return p(14)
				case 14: return p(15)
				case 15: return p(12)
				case 16: return p(17)
				case 17: return p(18)
				case 18: return p(19)
				case 19: return p(16)
			}
		}

		// Возвращает копию текущего блока
		block.getCopy = function () {
			return getBlock(block.type, block.color, block.x, block.y)
		}

		return block
	}

	// Проверка на возможность присутствия такого блока в матрицы игры
	function canBlockExists (block) {
		const parts = block.getIncludedParts()

		for (const part of parts) {
			if (getField(part.x, part.y)) {
				return false
			}
		}

		return true
	}

	// Получить элемент матрицы
	function getField (x, y) {
		if (map[y] === undefined || map[y][x] === undefined) {
			return 'black'
		}

		return map[y][x]
	}

	// Записать элемент матрицы
	function setField (x, y, value) {
		if (map[y] === undefined || map[y][x] === undefined) {
			return
		}

		return map[y][x] = value
	}

	// Свдиг блока влево
	function moveBlockLeft () {
		const blockCopy = block.getCopy()

		blockCopy.x = blockCopy.x - 1

		if (canBlockExists(blockCopy)) {
			block = blockCopy
		}
	}

	// Свдиг блока вправо
	function moveBlockRight () {
		const blockCopy = block.getCopy()

		blockCopy.x = blockCopy.x + 1

		if (canBlockExists(blockCopy)) {
			block = blockCopy
		}
	}

	// Поворот блока
	function rotateBlock () {
		const blockCopy = block.getNextBlock()

		if (canBlockExists(blockCopy)) {
			block = blockCopy
		}
	}

	// Свдиг блока вниз
	function moveBlockDown () {
		const blockCopy = block.getCopy()

		blockCopy.y = blockCopy.y + 1

		if (canBlockExists(blockCopy)) {
			block = blockCopy
		}
	}
}