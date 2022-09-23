defmodule WordInterfaceWeb.GameChannel do
  use WordInterfaceWeb, :channel

  alias WordEngine.{Game, GameSupervisor}
  alias WordInterfaceWeb.Presence

  def join("game:" <> _player, %{"screen_name" => screen_name}, socket) do
    if authorized?(socket, screen_name) do
      send(self(), {:after_join, screen_name})
      {:ok, socket}
    else
      {:error, %{reason: "unauthorized"}}
    end
  end

  def handle_in("new_game", _payload, socket) do
    "game:" <> player = socket.topic
    case GameSupervisor.start_game(player) do
      {:ok, _pid} -> {:reply, :ok, socket}
      {:error, reason} -> {:reply, {:error, %{reason: inspect(reason)}}, socket}
    end
  end

  def handle_in("add_player", player, socket) do
    case Game.add_player(via(socket.topic), player) do
      :ok ->
        broadcast! socket, "player_added", %{message: "New player just joined: " <> player}
        {:noreply, socket}
      {:error, reason} ->
        {:reply, {:error, %{reason: inspect(reason)}}, socket}
      :error -> {:reply, :error, socket}
    end
  end

  def handle_in("position_word", payload, socket) do
    %{"player" => player, "word" => word, "row" => row, "col" => col, "letter" => letter} = payload
    player = String.to_existing_atom(player)
    word = String.to_existing_atom(word)
    case Game.position_word(via(socket.topic), player, word, row, col, letter) do
      :ok -> {:reply, :ok, socket}
      _ -> {:reply, :error, socket}
    end
  end

  def handle_in("set_word", player, socket) do
    player = String.to_existing_atom(player)
    case Game.set_word(via(socket.topic), player) do
      {:ok, board} ->
        broadcast! socket, "player_set_word", %{player: player}
        {:reply, {:ok, %{board: board}}, socket}
      _ -> {:reply, :error, socket}
    end
  end

  def handle_in("guess_coordinate_letter", params, socket) do
    %{"player" => player, "row" => row, "col" => col, "letter" => letter} = params
    player = String.to_existing_atom(player)
    case Game.guess_coordinate_letter(via(socket.topic), player, row, col, letter) do
      {:hit, word, win} ->
        result = %{hit: true, word: word, win: win}
        broadcast! socket, "player_guessed_coordinate_letter", %{player: player, row: row, col: col, letter: letter, result: result}
        {:noreply, socket}
      {:miss, word, win} ->
        result = %{hit: false, word: word, win: win}
        broadcast! socket, "player_guessed_coordinate_letter", %{player: player, row: row, col: col, letter: letter, result: result}
        {:noreply, socket}
      :error ->
        {:reply, {:error, %{player: player, reason: "Not your turn"}}, socket}
      {:error, reason} ->
        {:reply, {:error, %{player: player, reason: reason}}, socket}
    end
  end

  def handle_in("show_subscribers", _payload, socket) do
    broadcast! socket, "subscribers", Presence.list(socket)
    {:noreply, socket}
  end

  def handle_info({:after_join, screen_name}, socket) do
    {:ok, _} = Presence.track(socket, screen_name, %{
      online_at: inspect(System.system_time(:second))
    })
    {:noreply, socket}
  end

  defp via("game:" <> player), do: Game.via_tuple(player)

  defp number_of_players(socket) do
    socket
    |> Presence.list()
    |> Map.keys()
    |> length()
  end

  defp existing_player?(socket, screen_name) do
    socket
    |> Presence.list()
    |> Map.has_key?(screen_name)
  end

  defp authorized?(socket, screen_name) do
    number_of_players(socket) < 2 && !existing_player?(socket, screen_name)
  end
end
