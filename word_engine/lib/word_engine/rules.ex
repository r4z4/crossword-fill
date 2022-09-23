defmodule WordEngine.Rules do
  alias __MODULE__

  defstruct state: :initialized,
            player1: :word_not_set,
            player2: :word_not_set

  def new(), do: %Rules{}

  def check(%Rules{state: :initialized} = rules, :add_player), do:
    {:ok, %Rules{rules | state: :players_set}}
  def check(%Rules{state: :players_set} = rules, {:position_word, player}) do
    case Map.fetch!(rules, player) do
      :word_set -> :error
      :word_not_set -> {:ok, rules}
    end
  end
  def check(%Rules{state: :players_set} = rules, {:set_word, player}) do
    rules = Map.put(rules, player, :word_set)
    case both_players_word_set?(rules) do
      true -> {:ok, %Rules{rules | state: :player1_turn}}
      false -> {:ok, rules}
    end
  end
  def check(%Rules{state: :player1_turn} = rules, {:guess_coordinate_letter, :player1}), do:
    {:ok, %Rules{rules | state: :player2_turn}}
  def check(%Rules{state: :player1_turn} = rules, {:win_check, win_or_not}) do
    case win_or_not do
      :no_win -> {:ok, rules}
      :win -> {:ok, %Rules{rules | state: :game_over}}
    end
  end
  def check(%Rules{state: :player2_turn} = rules, {:guess_coordinate_letter, :player2}), do:
    {:ok, %Rules{rules | state: :player1_turn}}
  def check(%Rules{state: :player2_turn} = rules, {:win_check, win_or_not}) do
    case win_or_not do
      :no_win -> {:ok, rules}
      :win -> {:ok, %Rules{rules | state: :game_over}}
    end
  end
  def check(_state, _action), do: :error

  defp both_players_word_set?(rules), do:
    rules.player1 == :word_set && rules.player2 == :word_set
end
