const atualizarStatus = async (pedido: Pedido, status: "aceito" | "recusado") => {
  if (status === "aceito") {
    await supabase.from("contratos").insert({
      pedido_id: pedido.id,
      profissional_id: (await supabase.auth.getUser()).data.user?.id,
      cliente_nome: pedido.cliente_nome,
      servico: pedido.servico,
      data_servico: pedido.data_servico,
    });
  }

  await supabase.from("pedidos").update({ status }).eq("id", pedido.id);
  carregarPedidos();
};
