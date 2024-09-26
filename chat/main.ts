import { addMessage, Message, onMessages } from './features/messages';

const inputForm = document.getElementById('input-form') as HTMLFormElement;
const input = document.getElementById('input') as HTMLInputElement;
const responses = document.querySelector('.responses') as HTMLDivElement;

inputForm.addEventListener('submit', (e) => {
  e.preventDefault();
  addMessage({
    from: 'user',
    content: input.value,
  });
  input.value = '';
});

function messageTemplate(message: Message) {
  return /*html*/ `
    <ul>${message.content}</ul>
  `;
}

onMessages((messages: Message[]) => {
  responses.innerHTML = messages.map(messageTemplate).join('');
});
