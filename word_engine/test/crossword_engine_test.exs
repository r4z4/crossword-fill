defmodule WordEngineTest do
  use ExUnit.Case
  doctest WordEngine

  test "greets the world" do
    assert WordEngine.hello() == :world
  end
end
