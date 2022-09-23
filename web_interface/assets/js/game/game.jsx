import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'underscore';
import {Socket} from "phoenix";

const socket = new Socket("/socket", {});
socket.connect();

function blankBoard() {
  let board = {};

  for (let i = 1; i <= 10; i++) {
    for (let j = 1; j <= 10; j++) {
      board[i + ":" + j] = {row: i, col: j, className: "coordinate_letter"};
    }
  }
  return board;
}

function getRows(board) {
  let rows = {1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [], 10: []};
  let boardValues = Object.values(board);

  _.each(boardValues, function(value) {
    rows[value.row].push(value);
  })
  return rows;
}

function hit(board, row, col) {
  board[row + ":" + col].className = "coordinate_letter hit";
  return board;
}

function miss(board, row, col) {
  board[row + ":" + col].className = "coordinate_letter miss";
  return board;
}

function inWord(board, coordinate_letters) {
  _.each(coordinate_letters, function(coord) {
    board[coord.row + ":" + coord.col].className = "coordinate_letter word";
  });
  return board;
}

function Coordinate(props) {
  return (
    <td
      className={props.className}
      data-row={props.row}
      data-col={props.col}
      onClick={props.onClick}
      onDragOver={props.onDragOver}
      onDrop={props.onDrop}
    />
  )
}

function Box(props) {
  return (
    <td className="box">
      {props.value}
    </td>
  );
}

function MessageBox(props) {
  return (
    <div className="message_box">
      {props.message}
    </div>
  )
}

function Button(props) {
  return (
    <div className="button" id={props.id} onClick={props.onClick}>
      {props.value}
    </div>
  )
}

function HeaderRow(props) {
  const range = _.range(1,11);

  return (
    <thead className="row">
      <tr>
        <Box />
        {range.map(function(i) {
          return (<Box value={i} key={i} />) 
        })}
      </tr>
    </thead>
  );
}

class OwnBoard extends React.Component {
  constructor(props) {
    super(props);
    this.allowDrop = this.allowDrop.bind(this);
    this.dropHandler = this.dropHandler.bind(this);
    this.state = {
      board: blankBoard(),
      player: props.player,
      channel: props.channel,
      message: "Welcome!",
      word: ["atoll", "dot", "l_shape", "s_shape", "square"]
    }
  }

  componentDidMount() {
    this.state.channel.on("player_guessed_coordinate_letter", response => {
      this.processOpponentGuess(response);
    })
  }

  componentWillUnmount() {
    this.state.channel.off("player_guessed_coordinate_letter", response => {
      this.processOpponentGuess(response);
    })
  }

  allowDrop(event) {
    event.preventDefault();
  }

  dropHandler(event) {
    event.preventDefault();
    const data = event.dataTransfer.getData("text");
    const image = document.getElementById(data);
    const row = Number(event.target.dataset.row);
    const col = Number(event.target.dataset.col);
    this.positionWord(event.target, image, row, col);
  }

  positionWord(coordinate_letter, word, row, col) {
    const params = {"player": this.state.player, "word": word.id, "row": row, "col": col};
    this.state.channel.push("position_word", params)
      .receive("ok", response => {
         coordinate_letter.appendChild(word);
         word.className = "positioned_word_image";
         this.setState({message: "Word Positioned!"});
       })
      .receive("error", response => {
         this.setState({message: "Oops!"});
       })
  }

  handleClick() {
    this.setWord(this.state.player);
  }

  setWord(player) {
    this.state.channel.push("set_word", player)
      .receive("ok", response => {
        this.removeWordImages(this.state.word);
        this.setWordCoordinates(response.board);
        this.setState({message: "Word set!"});
        document.getElementById("set_word").remove();
       })
      .receive("error", response => {
        this.setState({message: "Oops. Can't set your word yet."});
       })
  }

  extractCoordinates(board) {
    let coords = this.state.word.reduce(
      function(acc, word) {
        return acc.concat(board[word].coordinate_letters);
      }, []
    );
    return coords;
  }

  removeWordImages() {
    const images = document.getElementsByTagName("img");
    this.state.word.forEach(function(word) { images[word].remove(); });
  }

  setWordCoordinates(responseBoard) {
    const coordinate_letters = this.extractCoordinates(responseBoard, this.state.word);
    const newBoard = inWord(this.state.board, coordinate_letters);
    this.setState({board: newBoard});
  }

  processOpponentGuess(response) {
    let board = this.state.board;
    if (response.player !== this.state.player) {
      if (response.result.win === "win") {
        this.setState({message: "Your opponent won."});
        board = hit(board, response.row, response.col);
      } else if (response.result.word !== "none") {
        this.setState({message: "Your opponent greyed your " + response.result.word + " word."});
        board = hit(board, response.row, response.col);
      } else if (response.result.hit === true) {
        this.setState({message: "Your opponent hit your word."});
        board = hit(board, response.row, response.col);
      } else {
        this.setState({message: "Your opponent missed."});
        board = miss(board, response.row, response.col);
      }
    }

    this.setState({board: board});
  }

  renderRow(coordinate_letters, key) {
    const context = this;

    return (
      <tr className="row" key={key}>
        <Box value={key} />
        {coordinate_letters.map(function(coord, i) { 
          return ( <Coordinate
                      row={coord.row}
                      col={coord.col}
                      key={i}
                      onDragOver={context.allowDrop}
                      onDrop={context.dropHandler}
                      className={coord.className}
                   />)
        })}
      </tr>
    )
  }

  render() {
    const rows = getRows(this.state.board);
    const range = _.range(1,11);
    const context = this;

    return (
      <div id="own_board">
        <MessageBox message={context.state.message} />
        <table className="board" id="ownBoard">
          <caption className="board_title">your board</caption>
          <HeaderRow />
          <tbody>
            {range.map(function(i) {
              return (context.renderRow(rows[i], i))
            })}
          </tbody>
        </table>
        <Button value="Set Word" id="set_word" onClick={() => this.handleClick("start-game")} />
      </div>
    );
  }
}

class OpponentBoard extends React.Component {
   constructor(props) {
    super(props);
    this.state = {
      board: blankBoard(),
      player: props.player,
      message: "No opponent yet.",
      channel: props.channel
    }
  }

  componentDidMount() {
    this.state.channel.on("player_added", response => {
      this.processPlayerAdded();
    })

    this.state.channel.on("player_set_word", response => {
      this.processOpponentSetWord(response);
    })

    this.state.channel.on("player_guessed_coordinate_letter", response => {
      this.processGuess(response);
    })
  }

  componentWillUnmount() {
    this.state.channel.off("player_added", response => {
      this.processPlayerAdded();
    })

    this.state.channel.off("player_set_word", response => {
      this.processOpponentSetWord();
    })

    this.state.channel.off("player_guessed_coordinate_letter", response => {
      this.processGuess(response);
    })
  }

  processPlayerAdded() {
    this.setState({message: "Both players present."});
  }

  processOpponentSetWord(response) {
    if (this.state.player !== response.player) {
      this.setState({message: "Your opponent set their word."});
    }
  }

  handleClick(row, col) {
    this.guessCoordinate(this.state.player, row, col);
  }

  guessCoordinate(player, row, col) {
    const params = {"player": player, "row": row, "col": col};
    this.state.channel.push("guess_coordinate_letter", params)
      .receive("error", response => {
          this.setState({message: response.reason});
        })
  }

  processGuess(response) {
    let board = this.state.board;
    if (response.player === this.state.player) {
      if (response.result.win === "win") {
        this.setState({message: "You won!"});
        board = hit(board, response.row, response.col);
      } else if (response.result.word !== "none") {
        this.setState({message: "You greyed your opponent's " + response.result.word + " word!"});
        board = hit(board, response.row, response.col);
      } else if (response.result.hit === true) {
        this.setState({message: "It's a hit!"});
        board = hit(board, response.row, response.col);
      } else {
        this.setState({message: "Oops, you missed."});
        board = miss(board, response.row, response.col);
      }
    }

    this.setState({board: board});
  }

  renderRow(coordinate_letters, key) {
    const context = this;

    return (
      <tr className="row" key={key}>
        <Box value={key} />
        {coordinate_letters.map(function(coord, i) { 
          return ( <Coordinate
                      row={coord.row}
                      col={coord.col}
                      onClick={() => context.handleClick(coord.row, coord.col)}
                      key={i}
                      className={coord.className}
                   /> )
        })}
      </tr>
    )
  }

  render() {
    const rows = getRows(this.state.board);
    const range = _.range(1,11);
    const context = this;

    return (
      <div id="opponent_board">
        <MessageBox message={context.state.message} />
        <table className="board" id="opponentBoard">
          <caption className="board_title">your opponent's board</caption>
          <HeaderRow />
          <tbody>
            {range.map(function(i) {
              return (context.renderRow(rows[i], i)) 
            })}
          </tbody>
        </table>
      </div>
    );
  }
}

class Game extends React.Component {
  constructor(props) {
    super(props),
    this.handleClick = this.handleClick.bind(this),
    this.state = {
      isGameStarted: false,
      channel: null,
      player: null,
    }
  }

  renderStartButtons(props) {
    return (
      <div>
        <Button value="Start the Demo Game" onClick={() => this.handleClick("start-game")} />
        <Button value="Join the Demo Game" onClick={() => this.handleClick("join-game")} />
      </div>
    )
  }

  newChannel(screen_name) {
    return socket.channel("game:player1", {screen_name: screen_name});
  }

  join(channel) {
    channel.join()
      .receive("ok", response => {
         console.log("Joined successfully!");
       })
      .receive("error", response => {
         console.log("Unable to join");
       })
  }

  newGame(channel) {
    channel.push("new_game")
      .receive("ok", response => {
         console.log("New Game!");
       })
      .receive("error", response => {
         console.log("Unable to start a new game.");
       })
  }

  addPlayer(channel, player) {
    channel.push("add_player", player)
      .receive("ok", response => {
         console.log("Player added!");
       })
      .receive("error", response => {
          console.log("Unable to add new player: " + player, response);
        })
  }

  handleClick(action) {
    const player1_channel = this.newChannel("player1");
    const player2_channel = this.newChannel("player2");

    if (action === "start-game") {
      this.setState({channel: player1_channel});
      this.setState({player: "player1"});
      this.join(player1_channel);
      this.newGame(player1_channel);
    } else {
      this.setState({channel: player2_channel});
      this.setState({player: "player2"});
      this.join(player2_channel);
      this.addPlayer(player2_channel, "player2");
    }
    this.setState({isGameStarted: true})
  }

  renderGame(props) {
    const context = this;

    function dragStartHandler(event) {
      event.dataTransfer.setData("text/plain", event.target.id);
    }

    return (
      <div>
         <div id="holder">
           <img id="atoll" src="images/atoll.png" width="60" height="90" draggable="true" onDragStart={dragStartHandler} />
           <img id="dot" src="images/dot.png" width="30" height="30" draggable="true" onDragStart={dragStartHandler} />
           <img id="l_shape" src="images/l_shape.png" width="60" height="90" draggable="true" onDragStart={dragStartHandler} />
           <img id="s_shape" src="images/s_shape.png" width="90" height="60" draggable="true" onDragStart={dragStartHandler} />
           <img id="square" src="images/square.png" width="60" height="60" draggable="true" onDragStart={dragStartHandler} />
         </div>
        {<OwnBoard channel={context.state.channel} player={context.state.player} />}
        {<OpponentBoard channel={context.state.channel} player={context.state.player}/>}
      </div>
    )
  }

  render() {
    let contents;
    if (this.state.isGameStarted) {
      contents = this.renderGame();
    } else {
      contents = this.renderStartButtons();
    }

    return (
      <div>
        {contents}
      </div>
    )
  }
}

if (document.getElementById('word')) {
  ReactDOM.render(
    <Game />,
    document.getElementById('word')
  );
}