defmodule CrosswordInterfaceWeb.Presence do
  use Phoenix.Presence, otp_app: :crossword_interface,
                        pubsub_server: CrosswordInterface.PubSub
end
