defmodule WordEngine.Board do
  alias WordEngine.{Word, CoordinateLetter}

  def new(), do: %{}

  def position_word(board, key, %Word{} = word) do
    case overlaps_existing_word?(board, key, word) do
      true -> {:error, :overlapping_word}
      false -> Map.put(board, key, word)
    end
  end

  defp overlaps_existing_word?(board, new_key, new_word) do
    Enum.any?(board, fn {key, word} ->
      key != new_key and Word.overlaps?(word, new_word)
    end)
  end

  def all_word_positioned?(board), do:
    Enum.all?(Word.types, &(Map.has_key?(board, &1)))

  def guess(board, %CoordinateLetter{} = coordinate_letter) do
    board
    |> check_all_word(coordinate_letter)
    |> guess_response(board)
  end

  defp check_all_word(board, coordinate_letter) do
    Enum.find_value(board, :miss, fn {key, word} ->
      case Word.guess(word, coordinate_letter) do
        {:hit, word} -> {key, word}
        :miss -> false
      end
    end)
  end

  defp guess_response({key, word}, board) do
    board = %{board | key => word}
    {:hit, grey_check(board, key), win_check(board), board}
  end
  defp guess_response(:miss, board), do: {:miss, :none, :no_win, board}

  defp grey_check(board, key) do
    case greyed?(board, key) do
      true -> key
      false -> :none
    end
  end

  defp greyed?(board, key) do
    board
    |> Map.fetch!(key)
    |> Word.greyed?()
  end

  defp win_check(board) do
    case all_greyed?(board) do
      true -> :win
      false -> :no_win
    end
  end

  defp all_greyed?(board), do:
    Enum.all?(board, fn {_key, word} -> Word.greyed?(word) end)
end
