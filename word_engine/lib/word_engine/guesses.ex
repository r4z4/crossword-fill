defmodule WordEngine.Guesses do
  alias WordEngine.{CoordinateLetter, Guesses}

  @enforce_keys [:hits, :misses]
  defstruct [:hits, :misses]

  def new(), do:
    %Guesses{hits: MapSet.new(), misses: MapSet.new()}

  def add(%Guesses{} = guesses, :hit, %CoordinateLetter{} = coordinate_letter), do:
    update_in(guesses.hits, &MapSet.put(&1, coordinate_letter))

  def add(%Guesses{} = guesses, :miss, %CoordinateLetter{} = coordinate_letter), do:
    update_in(guesses.misses, &MapSet.put(&1, coordinate_letter))
end
