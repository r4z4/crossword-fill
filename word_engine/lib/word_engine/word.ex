defmodule WordEngine.Word do
  alias WordEngine.{CoordinateLetter, Word}

  @enforce_keys [:coordinate_letters, :hit_coordinate_letters]
  defstruct [:coordinate_letters, :hit_coordinate_letters]

  def new(type, %CoordinateLetter{} = upper_left) do
    with [_|_] = offsets <- offsets(type),
         %MapSet{} = coordinate_letters <- add_coordinate_letters(offsets, upper_left)
    do
      {:ok, %Word{coordinate_letters: coordinate_letters, hit_coordinate_letters: MapSet.new()}}
    else
      error -> error
    end
  end

  def types(), do: [:atoll, :dot, :l_shape, :s_shape, :square]

  def guess(word, coordinate_letter) do
    case MapSet.member?(word.coordinate_letters, coordinate_letter) do
      true ->
        hit_coordinate_letters = MapSet.put(word.hit_coordinate_letters, coordinate_letter)
        {:hit, %{word | hit_coordinate_letters: hit_coordinate_letters}}
      false -> :miss
    end
  end

  def overlaps?(existing_word, new_word), do:
    not MapSet.disjoint?(existing_word.coordinate_letters, new_word.coordinate_letters)

  def greyed?(word), do:
    MapSet.equal?(word.coordinate_letters, word.hit_coordinate_letters)

  defp add_coordinate_letters(offsets, upper_left) do
    Enum.reduce_while(offsets, MapSet.new(), fn offset, acc ->
      add_coordinate_letter(acc, upper_left, offset)
    end)
  end

  defp add_coordinate_letter(coordinate_letters, %CoordinateLetter{row: row, col: col, letter: letter}, {row_offset, col_offset}) do
    case CoordinateLetter.new(row + row_offset, col + col_offset) do
      {:ok, coordinate_letter} -> {:cont, MapSet.put(coordinate_letters, coordinate_letter)}
      {:error, :invalid_coordinate_letter} -> {:halt, {:error, :invalid_coordinate_letter}}
    end
  end

  # Horizontal & Vertical too - Se we will have 2 shapes : 

  defp offsets(:square), do: [{0, 0}, {0, 1}, {1, 0}, {1, 1}]
  defp offsets(:atoll), do: [{0, 0}, {0, 1}, {1, 1}, {2, 0}, {2, 1}]
  defp offsets(:dot), do: [{0, 0}]
  defp offsets(:l_shape), do: [{0, 0}, {1, 0}, {2, 0}, {2, 1}]
  defp offsets(:s_shape), do: [{0, 1}, {0, 2}, {1, 0}, {1, 1}]
  defp offsets(_), do: {:error, :invalid_word_type}
end
