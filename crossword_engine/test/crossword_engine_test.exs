defmodule CrosswordEngineTest do
  use ExUnit.Case
  doctest CrosswordEngine

  test "greets the world" do
    assert CrosswordEngine.hello() == :world
  end
end
