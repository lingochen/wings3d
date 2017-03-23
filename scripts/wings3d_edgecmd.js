/**
//    This module contains most edge command and edge utility functions.
//
//  Original Erlang Version: Bjorn Gustavsson.     
**/

var EdgeCommand = (function() {

/*%%%
%%%
%%% The Cut command.
%%%

cut(N, #st{selmode=edge}=St0) when N > 1 ->
    {St,Sel} = wings_sel:mapfold(
		 fun(Edges, #we{id=Id}=We0, Acc) ->
			 We = cut_edges(Edges, N, We0),
			 S = wings_we:new_items_as_gbset(vertex, We0, We),
			 {We,[{Id,S}|Acc]}
		 end, [], St0),
    wings_sel:set(vertex, Sel, St);
cut(_, St) -> St.

cut_edges(Edges, N, We0) ->
    gb_sets:fold(fun(Edge, W0) ->
			 {We,_} = wings_edge:cut(Edge, N, W0),
			 We
		 end, We0, Edges).


%%% Cut at an arbitrary position.
%%%

cut_pick(St) ->
    {Tvs,Sel} = wings_sel:fold(
		  fun(Es, We, []) ->
			  case gb_sets:to_list(Es) of
			      [E] -> cut_pick_make_tvs(E, We);
			      _ -> cut_pick_error()
			  end;
		     (_, _, _) ->
			  cut_pick_error()
		  end, [], St),
    Units = [{percent,{0.0,1.0}}],
    Flags = [{initial,[0]}],
    wings_drag:setup(Tvs, Units, Flags, wings_sel:set(vertex, Sel, St)).

-spec cut_pick_error() -> no_return().
cut_pick_error() ->
    wings_u:error_msg(?__(1,"Only one edge can be cut at an arbitrary position.")).

cut_pick_make_tvs(Edge, #we{id=Id,es=Etab,vp=Vtab,next_id=NewV}=We) ->
    #edge{vs=Va,ve=Vb} = array:get(Edge, Etab),
    Start = array:get(Va, Vtab),
    End = array:get(Vb, Vtab),
    Dir = e3d_vec:sub(End, Start),
    Char = {7,7,3.0,3.0,7.0,0.0,
	    <<2#01111100,
	     2#10000010,
	     2#10000010,
	     2#10000010,
	     2#10000010,
	     2#10000010,
	     2#01111100>>},
    Fun = fun(I, D) -> cut_pick_marker(I, D, Edge, We, Start, Dir, Char) end,
    Sel = [{Id,gb_sets:singleton(NewV)}],
    {{general,[{Id,Fun}]},Sel}.

cut_pick_marker([I], D, Edge, We0, Start, Dir, Char) ->
    {X,Y,Z} = Pos = e3d_vec:add_prod(Start, Dir, I),
    {MM,PM,ViewPort} = wings_u:get_matrices(0, original),
    {Sx,Sy,_} = wings_gl:project(X, Y, Z, MM, PM, ViewPort),
    Draw = fun() ->
		   gl:pushAttrib(?GL_ALL_ATTRIB_BITS),
		   gl:color3f(1.0, 0.0, 0.0),
		   gl:shadeModel(?GL_FLAT),
		   gl:disable(?GL_DEPTH_TEST),
		   gl:matrixMode(?GL_PROJECTION),
		   gl:pushMatrix(),
		   gl:loadIdentity(),
		   {W,H} = wings_wm:win_size(),
		   glu:ortho2D(0.0, W, 0.0, H),
		   gl:matrixMode(?GL_MODELVIEW),
		   gl:pushMatrix(),
		   gl:loadIdentity(),
		   gl:rasterPos2f(Sx, Sy),
		   wings_io:draw_bitmap(Char),
		   gl:popMatrix(),
		   gl:matrixMode(?GL_PROJECTION),
		   gl:popMatrix(),
		   gl:popAttrib()
	   end,
    {We,_} = wings_edge:fast_cut(Edge, Pos, We0),
    D#dlo{hilite={edge, {call_in_this_win,wings_wm:this(),Draw}},src_we=We};
cut_pick_marker({finish,[I]}, D0, Edge, We, Start, Dir, Char) ->
    D = cut_pick_marker([I], D0, Edge, We, Start, Dir, Char),
    D#dlo{vs=none,hilite=none}.*/

}());



