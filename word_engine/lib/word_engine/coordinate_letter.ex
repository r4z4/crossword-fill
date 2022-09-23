defmodule WordEngine.CoordinateLetter do
  alias __MODULE__

  @enforce_keys [:row, :col, :letter]
  defstruct [:row, :col, :letter]

  @board_range 1..10
  @letter_set ['w', 'h', 'd', 'o', 'r', 'l', 's', 'e']

  def new(row, col, letter) when row in(@board_range) and col in(@board_range) and letter in(@letter_set), do:
    {:ok, %CoordinateLetter{row: row, col: col, letter: letter}}
  def new(_row, _col, _letter), do: {:error, :invalid_coordinate_letter}
end
