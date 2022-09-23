defmodule WordInterfaceWeb.Presence do
  use Phoenix.Presence, otp_app: :word_interface,
                        pubsub_server: WordInterface.PubSub
end
