import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Linking, Pressable, TextInput, View } from 'react-native';
import { Button, Header, IconBox, Screen, T } from '@/components/ui';
import { uid, useStore } from '@/lib/store';
import { brand, font, useTheme } from '@/lib/theme';

export default function Checklist() {
  const p = useTheme();
  const { state, dispatch } = useStore();
  const [listId, setListId] = useState<string | undefined>(state.checklists[0]?.id);
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  const [link, setLink] = useState('');
  const list = state.checklists.find((l) => l.id === listId) ?? state.checklists[0];
  const done = list.items.filter((i) => i.done).length;

  function addItem() {
    if (!text.trim()) return;
    dispatch({ type: 'addItem', listId: list.id, item: { id: uid(), text: text.trim(), link: link.trim() || undefined, done: false } });
    setText(''); setLink(''); setAdding(false);
  }
  function newList() {
    const id = uid();
    dispatch({ type: 'addChecklist', list: { id, name: `Car Project ${state.checklists.length + 1}`, items: [] } });
    setListId(id); setOpen(false);
  }
  function deleteList() {
    Alert.alert('Delete checklist', `Delete ${list.name} and all its items?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { dispatch({ type: 'deleteChecklist', id: list.id }); setListId(undefined); } },
    ]);
  }

  return (
    <Screen footer={
      <View style={{ flexDirection: 'row', gap: 14 }}>
        <Button label="Delete" icon="trash-2" variant="outline" style={{ flex: 1, borderRadius: 30 }} onPress={deleteList} />
        <Button label="Add New" icon="plus-circle" style={{ flex: 1, borderRadius: 30 }} onPress={() => setAdding(true)} />
      </View>
    }>
      <Header title="My Check List" />
      <View style={{ alignItems: 'center', marginBottom: 28 }}>
        <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: p.row, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialCommunityIcons name="car" size={62} color={brand.orange} />
        </View>
        <T muted size={13} style={{ marginTop: 12 }}>{done} of {list.items.length} checked</T>
      </View>

      <View style={{ gap: 18 }}>
        <View>
          <Pressable onPress={() => setOpen(!open)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: p.fieldBorder, borderRadius: 8, paddingHorizontal: 8, height: 58 }}>
            <IconBox name="truck" filled />
            <T size={15} style={{ flex: 1 }}>{list.name}</T>
            <Feather name={open ? 'chevron-up' : 'chevron-down'} size={20} color={p.text} />
          </Pressable>
          {open && (
            <View style={{ borderWidth: 1, borderColor: p.line, borderRadius: 8, marginTop: 6, backgroundColor: p.bgRaised }}>
              {state.checklists.map((l) => (
                <Pressable key={l.id} onPress={() => { setListId(l.id); setOpen(false); }} style={{ paddingVertical: 12, paddingHorizontal: 16 }}>
                  <T size={15} weight={l.id === list.id ? 'semibold' : 'regular'}>{l.name}</T>
                </Pressable>
              ))}
              <Pressable onPress={newList} style={{ paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <Feather name="plus" size={16} color={brand.orange} /><T size={15} style={{ color: brand.orange }}>New checklist</T>
              </Pressable>
            </View>
          )}
        </View>

        {list.items.map((item) => (
          <View key={item.id} style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: item.done ? brand.orange : p.fieldBorder, borderRadius: 8, paddingHorizontal: 8, minHeight: 58, paddingVertical: 8 }}>
              <Pressable onPress={() => dispatch({ type: 'toggleItem', listId: list.id, itemId: item.id })} accessibilityRole="checkbox" accessibilityState={{ checked: item.done }}
                style={{ width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: item.done ? brand.orange : '#FFFFFF' }}>
                <Feather name={item.done ? 'check' : 'droplet'} size={18} color={item.done ? '#FFFFFF' : brand.orange} />
              </Pressable>
              <T size={15} muted={item.done} style={{ flex: 1, textDecorationLine: item.done ? 'line-through' : 'none' }}>{item.text}</T>
              <Pressable onPress={() => dispatch({ type: 'removeItem', listId: list.id, itemId: item.id })} hitSlop={10} accessibilityLabel={`Remove ${item.text}`}>
                <Feather name="x-circle" size={20} color={p.text} />
              </Pressable>
            </View>
            {item.link ? (
              <Pressable onPress={() => Linking.openURL(item.link!)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name="youtube" size={20} color="#FF0000" />
                <T size={12} numberOfLines={1} style={{ flex: 1, textDecorationLine: 'underline' }}>{item.link}</T>
              </Pressable>
            ) : null}
          </View>
        ))}

        {adding && (
          <View style={{ gap: 10, borderWidth: 1, borderColor: brand.orange, borderRadius: 10, padding: 12 }}>
            <TextInput value={text} onChangeText={setText} placeholder="What to check, e.g. Check tyre pressure" placeholderTextColor={p.textMuted} autoFocus
              style={{ color: p.text, fontFamily: font.regular, fontSize: 15, paddingVertical: 8 }} />
            <TextInput value={link} onChangeText={setLink} placeholder="Video link (optional)" placeholderTextColor={p.textMuted} autoCapitalize="none" keyboardType="url"
              style={{ color: p.text, fontFamily: font.regular, fontSize: 13, paddingVertical: 8, borderTopWidth: 1, borderTopColor: p.line }} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button label="Cancel" variant="outline" style={{ flex: 1, height: 44 }} onPress={() => setAdding(false)} />
              <Button label="Add" style={{ flex: 1, height: 44 }} onPress={addItem} />
            </View>
          </View>
        )}
        {!list.items.length && !adding && <T muted style={{ textAlign: 'center', marginTop: 12 }}>No checks yet. Tap Add New to start your list.</T>}
      </View>
    </Screen>
  );
}
